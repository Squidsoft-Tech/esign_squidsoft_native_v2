import { createNativeStackNavigator } from "@react-navigation/native-stack";
import routes from "../../constants/routes";
import Dashboard from "../Dashboard";
import Login from "../Login";
import Register from "../Register";
import SplashScreen from "../SplashScreen";
const Stack = createNativeStackNavigator();

const AppStack = () => {
  return (
    <Stack.Navigator initialRouteName={routes.dashboard}>
      <Stack.Screen
        name={routes.splash}
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={routes.dashboard}
        component={Dashboard}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
export default AppStack;
