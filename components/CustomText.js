import { Text } from 'react-native';

export default function CustomText(props) {
  return (
    <Text
      {...props}
      style={[{ fontFamily: 'SFPro-Regular' }, props.style]}
    >
      {props.children}
    </Text>
  );
}
