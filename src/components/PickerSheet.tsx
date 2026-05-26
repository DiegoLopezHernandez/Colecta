import React from 'react';
import { View, Text, Modal, Pressable, FlatList } from 'react-native';

interface Option {
  value: string;
  label: string;
  emoji?: string;
  color?: string;
}

interface Props {
  title: string;
  open: boolean;
  options: Option[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export const PickerSheet: React.FC<Props> = ({
  title,
  open,
  options,
  selectedValue,
  onSelect,
  onClose,
}) => {
  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} transparent>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: '#141417',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: '#26262B',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 24,
            maxHeight: '75%',
          }}
        >
          {/* Handle visual */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#3A3A40',
              alignSelf: 'center',
              marginBottom: 12,
            }}
          />
          <View
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
          >
            <Text
              style={{ color: '#F4F4F5', fontSize: 17, fontWeight: '600', flex: 1 }}
            >
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={{ color: '#D4A24B', fontSize: 14, fontWeight: '500' }}>
                Cerrar
              </Text>
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(o) => o.value}
            renderItem={({ item }) => {
              const isSel = item.value === selectedValue;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item.value);
                    onClose();
                  }}
                  style={({ pressed }) => ({
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderBottomWidth: 1,
                    borderBottomColor: '#1C1C20',
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  {item.emoji ? (
                    <Text style={{ fontSize: 18, marginRight: 10 }}>{item.emoji}</Text>
                  ) : null}
                  <Text
                    style={{
                      color: isSel ? '#D4A24B' : '#F4F4F5',
                      fontSize: 15,
                      fontWeight: isSel ? '600' : '400',
                    }}
                  >
                    {item.label}
                  </Text>
                  {item.color ? (
                    <View
                      style={{
                        backgroundColor: item.color,
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        marginLeft: 8,
                      }}
                    />
                  ) : null}
                  {isSel ? (
                    <Text style={{ marginLeft: 'auto', color: '#D4A24B', fontSize: 15 }}>
                      ✓
                    </Text>
                  ) : null}
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};
