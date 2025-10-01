// hooks/useHideTabBar.js - SYNCED WITH APP.JS
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useHideTabBar() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // ✅ Tạo default tab bar style GIỐNG HỆT App.js
  const getDefaultTabBarStyle = useCallback(() => ({
    height: 50 + insets.bottom, // ✅ GIỐNG App.js
    paddingBottom: insets.bottom, // ✅ GIỐNG App.js
    backgroundColor: '#FFFFFF', // ✅ GIỐNG App.js (không phải #f9fafb)
    borderTopWidth: 0,
    elevation: 20, // ✅ GIỐNG App.js (không phải 10)
    shadowColor: '#000000', // ✅ GIỐNG App.js
    shadowOffset: { width: 0, height: -2 }, // ✅ GIỐNG App.js (không phải -3)
    shadowOpacity: 0.1, // ✅ GIỐNG App.js (không phải 1)
    shadowRadius: 10, // ✅ GIỐNG App.js (không phải 1)
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // ✅ KHÔNG có overflow và display vì App.js không có
  }), [insets.bottom]);
  
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      
      if (!parent) return;
      
      // ✅ Hide tab bar khi screen được focus
      parent.setOptions({ 
        tabBarStyle: { display: 'none' } 
      });
      
      // ✅ CLEANUP function
      return () => {
        // ✅ Delay để đảm bảo navigation transition hoàn tất
        const timeoutId = setTimeout(() => {
          try {
            const currentState = navigation.getState();
            
            if (!currentState) {
              // ✅ Fallback - restore default style
              parent.setOptions({
                tabBarStyle: getDefaultTabBarStyle(),
              });
              return;
            }
            
            const currentRoute = currentState.routes?.[currentState.index];
            
            // ✅ Kiểm tra nested navigation để handle stack navigator
            let isOnArticleDetail = false;
            
            // Check direct route name
            if (currentRoute?.name === 'ArticleDetail') {
              isOnArticleDetail = true;
            }
            
            // Check nested routes trong stack
            if (currentRoute?.state) {
              const nestedState = currentRoute.state;
              const nestedRoute = nestedState.routes?.[nestedState.index];
              if (nestedRoute?.name === 'ArticleDetail') {
                isOnArticleDetail = true;
              }
            }
            
            // ✅ Chỉ show tab bar nếu KHÔNG ở ArticleDetail
            if (!isOnArticleDetail) {
              parent.setOptions({
                tabBarStyle: getDefaultTabBarStyle(),
              });
            }
          } catch (error) {
            // ✅ Error handling - luôn restore tab bar nếu có lỗi
            console.warn('Error in useHideTabBar cleanup:', error);
            parent.setOptions({
              tabBarStyle: getDefaultTabBarStyle(),
            });
          }
        }, 50); // ✅ 50ms delay như version cũ
        
        // ✅ Cleanup timeout để tránh memory leak
        return () => clearTimeout(timeoutId);
      };
    }, [navigation, getDefaultTabBarStyle])
  );
}

// ✅ ALTERNATIVE VERSION - Simplified nếu cần
export function useHideTabBarSimple() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      
      // Hide tab bar
      parent?.setOptions({ 
        tabBarStyle: { display: 'none' } 
      });
      
      // Show tab bar when leave
      return () => {
        setTimeout(() => {
          const state = navigation.getState();
          const currentRoute = state?.routes?.[state.index];
          
          // ✅ Check cả direct và nested routes
          const isArticleDetail = currentRoute?.name === 'ArticleDetail' || 
                                 currentRoute?.state?.routes?.[currentRoute.state.index]?.name === 'ArticleDetail';
          
          if (!isArticleDetail) {
            parent?.setOptions({
              tabBarStyle: {
                height: 50 + insets.bottom,
                paddingBottom: insets.bottom,
                backgroundColor: '#FFFFFF',
                borderTopWidth: 0,
                elevation: 20,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
              },
            });
          }
        }, 50);
      };
    }, [navigation, insets.bottom])
  );
}