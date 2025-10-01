import React from 'react';
import { View } from 'react-native';

export default function SkeletonLoader({ itemCount = 5 }) {
  const skeletons = Array.from({ length: itemCount });

  return (
    <View className="gap-3 px-4 pt-5">
      {skeletons.map((_, idx) => (
        <View key={idx} className="flex-row items-start space-x-3 animate-pulse">
          {/* Text block */}
          <View className="flex-1 flex-col justify-between gap-2">
            <View className="w-4/5 h-4 bg-gray-200 rounded" />
            <View className="w-3/5 h-4 bg-gray-200 rounded" />
            <View className="w-2/5 h-4 bg-gray-200 rounded mt-1" />
            <View className="w-4/5 h-4 bg-gray-200 rounded" />
          </View>
          {/* Image block */}
          <View className="w-28 h-28 bg-gray-200 rounded-md" />
        </View>
      ))}
    </View>
  );
}
