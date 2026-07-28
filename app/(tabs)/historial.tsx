// app/(tabs)/historial.tsx
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useHistorial } from '../../src/presentation/hooks/useHistorial';
import { useToast } from '../../src/presentation/hooks/useToast';
import { CardHistorial } from '../../src/presentation/components/features/historial/CardHistorial';
import { ModalDetalleHistorial } from '../../src/presentation/components/features/historial/ModalDetalleHistorial';
import { HistorialTurno } from '../../src/domain/entities/HistorialTurno';
import { Colors, Typography, Spacing, AccentLine, Radius } from '../../src/constants/theme';
import { formatMoneda } from '../../src/utils/formatters';

export default function HistorialScreen() {
  const { historial, cargando, recargar, eliminar } = useHistorial();
  const toast = useToast();
  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar])
  );
  const [registroSeleccionado, setRegistroSeleccionado] = useState<HistorialTurno | null>(null);

  const handleEliminar = (id: number) => {
    Alert.alert(
      'Eliminar registro',
      '¿Estás seguro? Este registro no se puede recuperar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminar(id);
              toast.exito('Registro eliminado', 'El registro fue eliminado del historial');
            } catch {
              toast.error('Error', 'No se pudo eliminar el registro');
            }
          },
        },
      ]
    );
  };

  // Totales acumulados del historial
  const totalVentas = historial.reduce((acc, h) => acc + h.total_ventas, 0);
  const totalGanancias = historial.reduce((acc, h) => acc + h.ganancia_neta, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Historial</Text>
          <View style={styles.accentLine} />
          <Text style={styles.subtitulo}>
            {historial.length === 0
              ? 'Sin turnos cerrados'
              : `${historial.length} turno${historial.length !== 1 ? 's' : ''} cerrado${historial.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
        {/* Botón recargar */}
        <TouchableOpacity
          style={styles.botonRecargar}
          onPress={recargar}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="refresh" size={20} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Resumen acumulado — solo si hay registros */}
      {historial.length > 0 && (
        <View style={styles.resumenTotal}>
          <View style={styles.resumenItem}>
            <Text style={styles.resumenLabel}>Total ventas acumuladas</Text>
            <Text style={styles.resumenValorAzul}>{formatMoneda(totalVentas)}</Text>
          </View>
          <View style={styles.resumenSeparador} />
          <View style={styles.resumenItem}>
            <Text style={styles.resumenLabel}>Ganancia neta acumulada</Text>
            <Text style={[
              styles.resumenValorVerde,
              { color: totalGanancias >= 0 ? Colors.accentSuccess : Colors.accentDanger },
            ]}>
              {formatMoneda(totalGanancias)}
            </Text>
          </View>
        </View>
      )}

      {/* Contenido */}
      {cargando ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : historial.length === 0 ? (
        <View style={styles.centrado}>
          <MaterialCommunityIcons name="history" size={64} color={Colors.textDisabled} />
          <Text style={styles.vacioTitulo}>Sin registros</Text>
          <Text style={styles.vacioDescripcion}>
            Los turnos cerrados aparecerán aquí automáticamente con todos sus detalles.
          </Text>
        </View>
      ) : (
        <FlatList
          data={historial}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <CardHistorial
              registro={item}
              onVer={setRegistroSeleccionado}
              onEliminar={handleEliminar}
            />
          )}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de detalle */}
      <ModalDetalleHistorial
        visible={registroSeleccionado !== null}
        onClose={() => setRegistroSeleccionado(null)}
        registro={registroSeleccionado}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  titulo: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xxl,
    color: Colors.textPrimary,
  },
  accentLine: { ...AccentLine },
  subtitulo: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  botonRecargar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  resumenTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  resumenItem: {
    flex: 1,
    alignItems: 'center',
  },
  resumenLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  resumenValorAzul: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    color: Colors.accent,
  },
  resumenValorVerde: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
  },
  resumenSeparador: {
    width: 1,
    height: 40,
    backgroundColor: Colors.divider,
  },
  lista: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.lg,
  },
  vacioTitulo: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
    color: Colors.textSecondary,
  },
  vacioDescripcion: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    color: Colors.textDisabled,
    textAlign: 'center',
    lineHeight: 22,
  },
});