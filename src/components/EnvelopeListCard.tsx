import {
  View,
  Dimensions,
  Text,
  Touchable,
  TouchableOpacity,
  Vibration,
  Platform,
  PermissionsAndroid,
  Alert,
} from "react-native";
import routes from "../constants/routes";
import { EnvelopeType } from "../types/EnvelopeType";
import useAuth from "../utils/auth";
import { convertDate } from "../utils/dateConvertor";
import GetSvg from "../utils/GetSvg";
import { Envelope } from "../types/ViewEnvelopeTypes";
import React, { useState } from "react";
import getLocalDate from "../utils/getLocalDate";
import { useManageList, useToken } from "../utils/useReduxUtil";
import { ENVELOPELIST } from "../types/ManageListTypes";
import EnvelopeService from "../services/EnvelopeService";
import { useDispatch, useSelector } from "react-redux";
import { setSelfSignFields } from "../redux/reducers/TempFieldSlice";
import {
  setEnvelopeStep,
  setIsLoading,
  setUpdateQuery,
  setmodalData,
  setshowConfirmDeleteModal,
  setshowVoidEnvelopeModal,
} from "../redux/reducers/uiSlice";
import { setRecipients } from "../redux/reducers/RecipientSlice";
import {
  setDocuments,
  setSelecteDocument,
} from "../redux/reducers/documentsSlice";
import { setEnvelope } from "../redux/reducers/envelopeSlice";
import { ApplicationState } from "../redux/store";
import { isEmpty, times } from "lodash";
import ApiInstance from "../services/ApiInstance";
import handleResponse from "../services/handleResponse";
import ApiConfig from "../constants/ApiConfig";
import RNFetchBlob from "rn-fetch-blob";
import { useToast } from "react-native-toast-notifications";
import VoidEnvlopeModal from "./modals/VoidEnvlopeModal";
import apiEndpoint from "../constants/apiEndpoints";

interface EnvelopeListCardProps {
  envelope: ENVELOPELIST;
  navigation: any;
}

const EnvelopeListCard: React.FC<EnvelopeListCardProps> = ({
  envelope,
  navigation,
}) => {
  const dispatch = useDispatch();
  //const { currentTab } = useManageList();
  const currentTab = useSelector(
    (state: ApplicationState) => state?.manage?.currentTab
  );
  const [voidToken, setvoidToken] = useState<any>();

  const token = useToken();
  const toast = useToast();

  const checkPermission = async (type: "Documents" | "Audit trail") => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        // Start downloading
        handleDownload(type);
        console.log("Storage Permission Granted.");
      } else {
        // If permission denied then show alert
        Alert.alert("Error", "Storage Permission Not Granted");
      }
    } catch (err) {
      // To handle permission related exception
      console.log("++++" + err);
    }
  };
  const handleDownload = (type: "Documents" | "Audit trail") => {
    dispatch(setIsLoading(true));
    toast.show(`Please wait downloading ${type} `, {
      type: "success",
      duration: 3000,
    });
    const downloadToken =
      type === "Documents"
        ? envelope?.download?.split("api/").pop()
        : envelope?.audit_trail?.split("api/").pop();
    const { config, fs } = RNFetchBlob;
    const { DownloadDir } = fs.dirs; // You can check the available directories in the wiki.
    const options = {
      appendExt: type === "Documents" ? `.zip` : `.pdf`,
      fileCache: true,
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: false,
        mediaScannable: true,
        title:
          type === "Documents"
            ? `${"eSignDocuments_" + envelope?.id}.zip`
            : `${"eSignDocuments_" + envelope?.id}.pdf`,
        path:
          type === "Documents"
            ? `${DownloadDir}/${"eSignDocuments_" + envelope?.id}.zip`
            : `${DownloadDir}/${"eSignDocuments_" + envelope?.id}.pdf`,
      },
    };
    //  {
    //   fileCache: true,
    //   addAndroidDownloads: {
    //     useDownloadManager: true, // true will use native manager and be shown on notification bar.
    //     notification: true,
    //     path:
    //       type === "Documents"
    //         ? `${DownloadDir}/${"eSignDocuments_" + envelope?.id}.zip`
    //         : `${DownloadDir}/${"eSignDocuments_" + envelope?.id}.pdf`,
    //     description: "Downloading.",
    //   },
    // };

    RNFetchBlob.config(options)
      .fetch("GET", ApiConfig.API_URL + downloadToken, {
        Authorization: `Bearer ${token}`,
      })
      .then((res: any) => {
        dispatch(setIsLoading(false));
        toast.show(` ${type} download successfully `, {
          type: "success",
          duration: 3000,
        });
        if (res?.path()) {
          RNFetchBlob.android.actionViewIntent(
            res?.path(),
            type === "Documents" ? "application/zip" : "application/pdf"
          );
        }

        console.log("do some magic in here", res?.path());
      })
      .catch((err) => {
        dispatch(setIsLoading(false));
      });
  };
  return (
    <React.Fragment>
      <TouchableOpacity
        className=" rounded-lg border my-2 border-gray-200 p-1 bg-white"
        style={{
          height: isEmpty(envelope?.download || envelope?.audit_trail)
            ? 160
            : 195, //Dimensions.get("window").height * 0.1,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 0,
          },
          shadowOpacity: 0.1,
          shadowRadius: 0.1,
          elevation: 1,
        }}
        onPress={() => {
          // console.log("TYPE:", currentTab);
          if (currentTab == "draft") {
            EnvelopeService.handleFetchEnvelope(envelope?.id, (data) => {
              if (data) {
                // console.log("fetch envelope data", data);
                if (data?.self_sign) {
                  dispatch(setEnvelope(data));
                  dispatch(setEnvelopeStep(2));
                  dispatch(setSelfSignFields(data?.document_fields));
                } else {
                  dispatch(setEnvelopeStep(1));
                }
                dispatch(setDocuments(data?.envelope_documents));
                dispatch(setRecipients(data?.envelope_recipients));
                dispatch(setSelecteDocument(data?.envelope_documents?.[0]));
                navigation.navigate(routes.createEnvelope, {
                  existingEnvelope: envelope,
                });
                //navigate(ProtectedRoutes?.createEnvelope);
              }
            });
          } else {
            navigation.navigate(routes.viewEnvelope, {
              envelope,
              currentTab: currentTab == "inbox" ? "SIGN" : "VIEW",
            });
          }
        }}
      >
        <View className="my-1.5 w-full   flex flex-row justify-between items-end">
          <View className="">
            <Text
              className="mx-2 w-full text-xs max-h-1/2 font-semibold text-gray-700 items-baseline"
              numberOfLines={1}
            >
              {currentTab === "inbox"
                ? "Request From "
                : currentTab === "sent"
                ? "Sent To "
                : currentTab === "draft"
                ? "Draft by "
                : "Request From "}
            </Text>
          </View>
          <View className="w-56 max-w-56 flex justify-end ">
            <Text
              style={{
                textAlign: "right",
              }}
              className="mx-2  truncate flex text-end text-xs max-h-1/2 font-semibold text-gray-700 items-baseline"
              numberOfLines={1}
            >
              {currentTab === "sent"
                ? envelope?.recipients?.map((s: any) => s?.email)?.join(",")
                : envelope?.user?.email}
            </Text>
          </View>
        </View>
        <View className="my-1.5 w-full   flex flex-row justify-between items-end">
          <View className=" ">
            <Text
              className="mx-2 w-full text-xs max-h-1/2 font-semibold text-gray-700 items-baseline"
              numberOfLines={1}
            >
              Subject
            </Text>
          </View>
          <View className="w-56 max-w-56 flex justify-end ">
            <Text
              style={{
                textAlign: "right",
              }}
              className="mx-2  truncate flex text-end text-xs max-h-1/2 font-semibold text-gray-700 items-baseline"
              numberOfLines={1}
            >
              {envelope?.subject + " "}
            </Text>
          </View>
        </View>
        <View className="my-1.5 w-full   flex flex-row justify-between items-end">
          <View className="w-1/2">
            <Text
              className="mx-2 w-full text-xs max-h-1/2 font-semibold text-gray-700 items-baseline"
              numberOfLines={1}
            >
              Documents
            </Text>
          </View>
          <View className="">
            <Text
              className="mx-2  text-xs w-1/2 max-w-1/2 max-h-1/2 font-semibold text-gray-700 items-baseline"
              numberOfLines={1}
            >
              {envelope.envelope_documents?.map((document) => {
                return (
                  <GetSvg
                    key={document}
                    name="documentIcon"
                    classN="w-4 h-4"
                    color={"#d10000"}
                  />
                );
              })}
            </Text>
          </View>
        </View>
        <View className="my-2 w-full   flex flex-row justify-between items-end">
          <View className="w-1/2">
            <Text
              className="mx-2 w-full text-xs max-h-1/2 font-semibold text-gray-700 items-baseline"
              numberOfLines={1}
            >
              Status
            </Text>
          </View>
          <View className="">
            <Text
              className={`p-0.5 px-3 w-fit max-w-32 capitalize font-semibold rounded-2xl text-[10px]  ${
                envelope?.status === "COMPLETED"
                  ? "text-green-600 bg-green-100"
                  : envelope?.status === "VOID"
                  ? "text-gray-600 bg-gray-100"
                  : envelope?.status === "WAITING ON OTHERS"
                  ? "text-[#FF947A] bg-[#FFF4DE]"
                  : envelope?.status === "DRAFTED"
                  ? "text-[#FF947A] bg-[#FFF4DE]"
                  : envelope?.status === "SELF SIGNED"
                  ? "text-[#BF83FF] bg-[#F3E8FF]"
                  : envelope?.status === "REJECTED"
                  ? "text-red-600 bg-red-100"
                  : envelope?.status === "SIGNED"
                  ? "text-green-600 bg-green-100"
                  : envelope?.status === "PENDING"
                  ? "text-[#FF947A] bg-[#FFF4DE]"
                  : "text-red-600 bg-red-100"
              }`}
            >
              {envelope?.status === "COMPLETED"
                ? "Completed "
                : envelope?.status === "VOID"
                ? "Void "
                : envelope?.status === "WAITING ON OTHERS"
                ? "Waiting on others  "
                : envelope?.status === "DRAFTED"
                ? "Drafted by you  "
                : envelope?.status === "SELF SIGNED"
                ? "Self signed "
                : envelope?.status === "REJECTED"
                ? "Rejected by you "
                : envelope?.status === "SIGNED"
                ? "signed"
                : envelope?.status === "PENDING"
                ? "awaiting your action "
                : envelope?.status}
            </Text>
          </View>
        </View>
        <View className="mt-1.5 w-full   flex flex-row justify-between items-end">
          <View className="w-1/2">
            <Text
              className="mx-2 w-full text-xs max-h-1/2 font-semibold text-gray-700 items-baseline"
              numberOfLines={1}
            >
              Actions
            </Text>
          </View>
          <View className="flex flex-row justify-between">
            {envelope?.status !== "VOID" && currentTab === "sent" ? (
              <TouchableOpacity
                onPress={() => {
                  dispatch(setmodalData(envelope?.id));
                  dispatch(setshowVoidEnvelopeModal(true));
                }}
              >
                <GetSvg
                  name="VOIDICON"
                  color="#374151"
                  classN="w-6 h-6 mx-2"
                  pathStrokeWidth={1.2}
                />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={() => {
                dispatch(setmodalData(envelope?.delete_token));
                dispatch(setshowConfirmDeleteModal(true));
              }}
            >
              <GetSvg
                name="deleteIcon"
                color="#374151"
                classN="w-5 h-5 mx-2"
                pathStrokeWidth={1.2}
              />
            </TouchableOpacity>
          </View>
        </View>
        {!isEmpty(envelope?.download || envelope?.audit_trail) ? (
          <View className="my-2 w-full   flex flex-row justify-between items-end">
            <View className="flex mx-2 justify-center items-center ">
              <Text
                className="mx-2 w-full text-xs max-h-1/2 font-semibold text-gray-700 items-baseline"
                numberOfLines={1}
              >
                Download :{" "}
                <Text className="text-[9px] mx-5 text-gray-500">
                  ( click the icon to download )
                </Text>
              </Text>
            </View>
            <View className="flex flex-row justify-between">
              {envelope?.download ? (
                <TouchableOpacity
                  onPress={() => {
                    checkPermission("Documents");
                    // handleDownload("Documents");
                  }}
                >
                  <GetSvg
                    name="documentIcon"
                    color="#374151"
                    classN="w-6 h-6 mx-2"
                    pathStrokeWidth={1.2}
                  />
                </TouchableOpacity>
              ) : null}

              {envelope?.audit_trail ? (
                <TouchableOpacity
                  onPress={() => {
                    checkPermission("Audit trail");
                  }}
                >
                  <GetSvg
                    name="AUDITTRAILICON"
                    color="#374151"
                    classN="w-6 h-6 mx-2"
                    pathStrokeWidth={1.2}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}
        {/* <View className="h-2/4 w-full  flex flex-row justify-between items-center">
        <View className=" ">
          <Text
            className="mx-2 w-full text-xs max-h-1/2 font-semibold text-gray-700 items-baseline"
            numberOfLines={1}
          >
            {envelope?.subject ?? "Drafted by you"}
          </Text>
        </View>
        <View className=" ">
          <Text
            numberOfLines={1}
            className="mx-2  text-2xl font-black truncate w-1/2 max-w-1/2  tracking-wider"
          >
            {times(10)?.map((document) => {
              return (
                <GetSvg
                  key={document}
                  name="documentIcon"
                  classN="w-4 h-4"
                  color={"#d10000"}
                />
              );
            })}
          </Text>
        </View>
      </View> */}
        {/* {!["draft", "deleted"].includes(currentTab) ? (
        <View className="h-1/4 w-full  flex flex-row justify-between items-start">
          <View className="w-full">
            {envelope?.sent_at ? (
              <Text className="mx-2 text-xs text-gray-500">
                {getLocalDate(envelope?.sent_at ?? "").format(
                  "DD/MM/YYYY hh:mm A"
                )}
              </Text>
            ) : null}
          </View>
          {envelope?.expire_at ? (
            <View className="">
              <Text className="mx-2 text-xs text-gray-500">
                {convertDate(envelope?.expire_at ?? "", "datetime")}
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View className="h-1/4 w-full  flex flex-row justify-between items-start">
          <View className="">
            {envelope?.created_at ? (
              <Text className="mx-2 text-xs text-gray-500">
                {convertDate(envelope?.created_at ?? "", "datetime")}
              </Text>
            ) : null}
          </View>
        </View>
      )} */}
      </TouchableOpacity>
    </React.Fragment>
  );
};
export default EnvelopeListCard;
