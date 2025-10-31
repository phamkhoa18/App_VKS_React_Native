import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableWithoutFeedback, Platform, Image, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { Home, Bell, User, Search, MessageCircle, Book } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import "./global.css";
import { LinearGradient } from 'expo-linear-gradient';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import MaskedView from '@react-native-masked-view/masked-view';
import ArticleDetailScreen from './screens/ArticleDetailScreen';
import SearchResultScreen from './screens/SearchResultScreen';
import CategoryScreen from './screens/CategoryScreen';
import NotificationScreen from './screens/NotificationScreen';
import AccountScreen from './screens/AccountScreen';
import RegisterScreen from './screens/RegisterScreen';
import LoginScreen from './screens/LoginScreen';
import ChatBotScreen from './screens/ChatBotScreen';
import { UserProvider } from './context/UserContext';
import BookmarkScreen from './screens/BookmarkScreen';
import ProfileEditScreen from './screens/Account/ProfileEditScreen';
import UpdateManager from './components/UpdateManager';
import InfoScreen from './screens/InfoScreen';
import TopicScreen from './screens/Account/TopicScreen';
import SettingsScreen from './screens/Account/SettingScreen';
import NoteBookScreen from './screens/NoteBookScreen';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <Stack.Screen name="SearchResult" component={SearchResultScreen} />
    </Stack.Navigator>
  );
}

function CategoriesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CategoryMain" component={CategoryScreen} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
    </Stack.Navigator>
  );
}

function ChatBotStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatBotMain" component={ChatBotScreen} />
    </Stack.Navigator>
  );
}

function NoteBookStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NoteBookMain" component={NoteBookScreen} />
      <Stack.Screen name="Info" component={InfoScreen} />
    </Stack.Navigator>
  );
}

function NotificationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NotificationMain" component={NotificationScreen} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
    </Stack.Navigator>
  );
}

function BookmarkStack() {
  return (
    <Stack.Navigator  screenOptions={{ headerShown: false }}>
      <Stack.Screen name='BookmarkScreen' component={BookmarkScreen} ></Stack.Screen>
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
    </Stack.Navigator>
  )
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={AccountScreen} />
      <Stack.Screen name="Info" component={InfoScreen} />
      <Stack.Screen name="Bookmark" component={BookmarkStack} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen name="Topic" component={TopicScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  console.log(insets);
  
  
  const currentRoute = state.routes[state.index];
  const currentScreen = currentRoute.state?.routes?.[currentRoute.state?.index]?.name;
  
  if (currentScreen === 'ArticleDetail' || currentScreen === 'Search' || currentScreen === 'SearchResult' || currentScreen === 'Bookmark' || currentScreen === 'Info') {
    return null;
  }

  if (currentRoute.name === 'ChatBot') {
    return null;
  }

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      paddingTop: 15,
      paddingBottom: (Platform.OS === 'ios' ? 30 : 40) + insets.bottom ,
      paddingHorizontal: 20,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 20,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
    }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        if (route.name === 'ChatBot') {
          return (
            <View key={route.key} style={{ flex: 1, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={onPress}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: '#FFFFFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#007AFF',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  elevation: 8,
                  marginTop: -20,
                }}
              >
                <LinearGradient
                  colors={['#007AFF', '#00C6FF']}
                  style={{
                    width: 55,
                    height: 55,
                    borderRadius: 27.5,
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    position: "relative"
                  }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Image
                    source={require('./assets/icon_app.png')}
                    style={{
                      width: 60,
                      height: 60,
                      position: 'absolute',
                      top: 0
                    }}
                    resizeMode="contain"
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          );
        }

        let LucideIcon;
        switch (route.name) {
          case 'Home':
            LucideIcon = Home;
            break;
          case 'Categories':
            LucideIcon = Search;
            break;
          case 'Notifications':
            LucideIcon = Book;
            break;
          case 'Profile':
            LucideIcon = User;
            break;
          case 'NoteBook':
            LucideIcon = Book;  // hoặc icon khác
            break;
          default:
            LucideIcon = Home;
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 10,
            }}
          >
            {isFocused ? (
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MaskedView
                  maskElement={
                    <LucideIcon 
                      size={26} 
                      color="white" 
                      strokeWidth={2.5} 
                    />
                  }
                >
                  <LinearGradient
                    colors={['#007AFF', '#00C6FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ 
                      width: 26, 
                      height: 26,
                    }}
                  />
                </MaskedView>
              </View>
            ) : (
              <LucideIcon 
                size={26} 
                color="#6B7280" 
                strokeWidth={2} 
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Categories" component={CategoriesStack} />
      <Tab.Screen name="ChatBot" component={ChatBotStack} />
      {/* <Tab.Screen name="Notifications" component={NotificationsStack} /> */}
      <Tab.Screen name='NoteBook' component={NoteBookStack}/>
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'SFPro-Black': require('./assets/SF-Pro-Display/SF-Pro-Display-Black.otf'),
    'SFPro-Bold': require('./assets/SF-Pro-Display/SF-Pro-Display-Bold.otf'),
    'SFPro-Regular': require('./assets/SF-Pro-Display/SF-Pro-Display-Regular.otf'),
    'SFPro-Medium': require('./assets/SF-Pro-Display/SF-Pro-Display-Medium.otf'),
    'SFPro-Light': require('./assets/SF-Pro-Display/SF-Pro-Display-Light.otf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <UpdateManager>
      <UserProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="MainTabs" component={TabNavigator} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
            </Stack.Navigator>
            <StatusBar style="auto" />
          </NavigationContainer>
        </SafeAreaProvider>
      </UserProvider>
    </UpdateManager>
  );
}