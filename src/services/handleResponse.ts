import isObject from "lodash/isObject";
import ApiConfig from "../constants/ApiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SP from "../types/LocalStorageType";
import CryptoHandler from "../utils/EncryptDecryptHandler";
import { useToast } from "react-native-toast-notifications";
const handleResponse = async (res: any, toast?: any) => {
  const response = res?.data;
  // const userToken = await AsyncStorage.getItem(SP.AUTHTOKEN);
  // const token = userToken ?? ApiConfig.APP_AUTH_TOKEN_KEY;
  const encryption = false; // process.env.REACT_APP_ENCRYPTION;
  //console.log("FROM HANDLE RESPONSE", res);
  if (res?.status === 200) {
    const data = response?.data;
    //  encryption
    //   ? CryptoHandler.response(response?.data, token)
    //   : response?.data;

    if (res?.config?.method !== "get" && toast) {
      toast.show(response?.message, { type: "success" });
    }
    return data;
  } else if (res?.status === 401) {
    //localStorage.clear();
    // remove_cookie("token");
    await AsyncStorage.removeItem(SP.AUTHTOKEN);
    return false;
  } else {
    if (isObject(response)) {
      //@ts-ignore
      toast.show(response?.message, { type: "error" });
      console.log("response123", res);
      return false;
    } else {
      toast.show(response?.message, { type: "error" });
      //toast.error(response?.message);
      console.log("response123", res);
      //toast.error(response?.data?.error ?? response);
    }
  }
};

export default handleResponse;
