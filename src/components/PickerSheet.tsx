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
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-bg rounded-t-2xl p-4 max-h-[70%]">
          <View className="flex-row items-center mb-3">
            <Text className="text-white text-lg font-semibold flex-1">{title}</Text>
            <Pressable onPress={onClose}>
              <Text className="text-primary">Cerrar</Text>
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
                  className="py-3 border-b border-surface flex-row items-center"
                >
                  {item.emoji ? (
                    <Text className="text-xl mr-2">{item.emoji}</Text>
                  ) : null}
                  <Text
                    className={`text-base ${isSel ? 'text-primary font-semibold' : 'text-white'}`}
                  >
                    {item.label}
                  </Text>
                  {item.color ? (
                    <View
                      style={{ backgroundColor: item.color }}
                      className="w-3 h-3 rounded-full ml-2"
                    />
                  ) : null}
                  {isSel ? (
                    <Text className="ml-auto text-primary">✓</Text>
                  ) : null}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};
