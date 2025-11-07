import React, { useState } from 'react';
import { View, Modal, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Text, useTheme, Chip, List, Divider } from 'react-native-paper';

interface StatusOption {
  value: string;
  label: string;
  icon: string;
}

interface StatusDropdownProps {
  value: string;
  options: StatusOption[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  color: string;
  textSize?: number;
  showIcon?: boolean;
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  value,
  options,
  onSelect,
  disabled = false,
  color,
  textSize = 12,
  showIcon = true,
}) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  // Debug log
  console.log('📊 StatusDropdown props:', { value, optionsCount: options.length, disabled });

  const selectedOption = options.find(opt => opt.value === value);
  
  const handleSelect = (optionValue: string) => {
    setVisible(false);
    if (optionValue !== value) {
      onSelect(optionValue);
    }
  };

  const getDisplayText = () => {
    if (selectedOption) {
      return `${selectedOption.icon} ${selectedOption.label}`;
    }
    return value;
  };

  return (
    <>
      <Chip 
        style={{ backgroundColor: color }}
        textStyle={{ color: 'white', fontSize: textSize, fontWeight: '600' }}
        compact
        icon={showIcon ? "chevron-down" : undefined}
        onPress={(e: any) => {
          e?.stopPropagation?.();
          if (!disabled) {
            console.log('🎯 StatusDropdown chip pressed, opening modal');
            setVisible(true);
          }
        }}
        disabled={disabled}
      >
        {getDisplayText()}
      </Chip>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setVisible(false)}
        >
          <Pressable 
            style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Chọn trạng thái
            </Text>
            <Divider />
            <ScrollView style={styles.optionsList}>
              {options.map((option, index) => (
                <React.Fragment key={option.value}>
                  <List.Item
                    title={`${option.icon} ${option.label}`}
                    onPress={() => handleSelect(option.value)}
                    style={[
                      styles.listItem,
                      option.value === value && { backgroundColor: theme.colors.surfaceVariant }
                    ]}
                    titleStyle={[
                      styles.listItemText,
                      { color: theme.colors.onSurface },
                      option.value === value && { fontWeight: 'bold' }
                    ]}
                    disabled={option.value === value}
                  />
                  {index < options.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 12,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
  },
  optionsList: {
    maxHeight: 400,
  },
  listItem: {
    paddingVertical: 12,
  },
  listItemText: {
    fontSize: 16,
  },
});
