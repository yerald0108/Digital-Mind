// src/presentation/components/features/turno/ModalAbrirTurno.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Colors, Typography, Spacing, Radius } from '../../../../constants/theme';

interface ModalAbrirTurnoProps {
  visible: boolean;
  onClose: () => void;
  onConfirmar: (dias: number) => Promise<void>;
  diasActuales?: number; // para modo edición
  modoEdicion?: boolean;
}

const OPCIONES_DIAS = [1, 2, 3, 4, 5, 6];

export function ModalAbrirTurno({
  visible,
  onClose,
  onConfirmar,
  diasActuales = 1,
  modoEdicion = false,
}: ModalAbrirTurnoProps) {
  const [diasSeleccionados, setDiasSeleccionados] = useState(diasActuales);
  const [cargando, setCargando] = useState(false);

  const handleConfirmar = async () => {
    try {
      setCargando(true);
      await onConfirmar(diasSeleccionados);
      onClose();
    } catch {
      // El error se maneja en el padre con toast
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title={modoEdicion ? 'Editar duración del turno' : 'Abrir nuevo turno'}
      onClose={onClose}
    >
      <Text style={styles.descripcion}>
        {modoEdicion
          ? 'Cambia la duración del turno activo.'
          : 'Selecciona cuántos días durará este turno.'}
      </Text>

      {/* Selector de días */}
      <View style={styles.grid}>
        {OPCIONES_DIAS.map((dia) => {
          const seleccionado = diasSeleccionados === dia;
          return (
            <TouchableOpacity
              key={dia}
              style={[styles.opcion, seleccionado && styles.opcionSeleccionada]}
              onPress={() => setDiasSeleccionados(dia)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.opcionNumero,
                  seleccionado && styles.opcionNumeroSeleccionado,
                ]}
              >
                {dia}
              </Text>
              <Text
                style={[
                  styles.opcionLabel,
                  seleccionado && styles.opcionLabelSeleccionado,
                ]}
              >
                {dia === 1 ? 'día' : 'días'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Resumen */}
      <View style={styles.resumen}>
        <Text style={styles.resumenTexto}>
          Turno de{' '}
          <Text style={styles.resumenDestacado}>
            {diasSeleccionados} {diasSeleccionados === 1 ? 'día' : 'días'}
          </Text>
        </Text>
      </View>

      {/* Botones */}
      <View style={styles.botones}>
        <Button
          label="Cancelar"
          variant="ghost"
          onPress={onClose}
          style={styles.botonCancelar}
        />
        <Button
          label={modoEdicion ? 'Actualizar' : 'Abrir turno'}
          variant={modoEdicion ? 'primary' : 'success'}
          icon={modoEdicion ? 'content-save-outline' : 'play-circle-outline'}
          onPress={handleConfirmar}
          loading={cargando}
          style={styles.botonConfirmar}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  descripcion: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  opcion: {
    width: '30%',
    aspectRatio: 1.2,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcionSeleccionada: {
    backgroundColor: 'rgba(79, 142, 247, 0.15)',
    borderColor: Colors.accent,
  },
  opcionNumero: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xxl,
    color: Colors.textSecondary,
  },
  opcionNumeroSeleccionado: {
    color: Colors.accent,
  },
  opcionLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textDisabled,
  },
  opcionLabelSeleccionado: {
    color: Colors.accent,
  },
  resumen: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resumenTexto: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  resumenDestacado: {
    fontFamily: Typography.fontFamilyBold,
    color: Colors.accent,
  },
  botones: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  botonCancelar: { flex: 1 },
  botonConfirmar: { flex: 2 },
});