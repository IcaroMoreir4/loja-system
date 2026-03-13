import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';

type ResponsiveModalProps = {
  visible: boolean;
  onRequestClose?: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
  centeredContent?: boolean;
  titleColor?: string;
};

export function ResponsiveModal({
  visible,
  onRequestClose,
  title,
  children,
  footer,
  maxWidth = 500,
  centeredContent = false,
  titleColor = '#09090b',
}: ResponsiveModalProps) {
  const { height } = useWindowDimensions();
  const maxModalHeight = Math.max(320, Math.min(760, Math.floor(height * 0.9)));
  const bodyMaxHeight = Math.max(140, maxModalHeight - (title ? 76 : 24) - (footer ? 92 : 24));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { maxWidth, maxHeight: maxModalHeight }]}>
          {title ? (
            <View style={[styles.header, centeredContent && styles.headerCentered]}>
              <Text style={[styles.title, { color: titleColor }, centeredContent && styles.centerText]}>{title}</Text>
            </View>
          ) : null}

          <ScrollView
            style={[styles.body, { maxHeight: bodyMaxHeight }]}
            contentContainerStyle={[styles.bodyContent, centeredContent && styles.centerBodyContent]}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  headerCentered: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#09090b',
  },
  body: {
    width: '100%',
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  centerBodyContent: {
    alignItems: 'center',
  },
  footer: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  centerText: {
    textAlign: 'center',
  },
});
