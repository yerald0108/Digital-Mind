// src/presentation/components/ui/Modal.tsx
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../presentation/hooks/useTheme';
import { Typography, Spacing, Radius, Shadows } from '../../../constants/theme';

interface ModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  scrollable?: boolean;
}

export function Modal({ visible, title, onClose, children, scrollable = false }: ModalProps) {
  const { C } = useTheme();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.overlay, { backgroundColor: C.overlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.container, { backgroundColor: C.bgSurface, borderColor: C.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: C.textPrimary }]}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel={`Cerrar ${title}`}
              hitSlop={10}
            >
              <MaterialCommunityIcons name="close" size={20} color={C.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={[styles.accentLine, { backgroundColor: C.accent }]} />
          {scrollable ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.content}>{children}</View>
            </ScrollView>
          ) : (
            <View style={styles.content}>{children}</View>
          )}
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    maxHeight: '90%',
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 0,
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    flex: 1,
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  accentLine: {
    height: 2,
    width: 36,
    borderRadius: Radius.full,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: 0,
  },
});
