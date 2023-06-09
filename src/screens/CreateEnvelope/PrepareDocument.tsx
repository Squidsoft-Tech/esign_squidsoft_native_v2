import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import GetSvg from "../../utils/GetSvg";
import { useEffect, useState } from "react";
import SelectDropdown from "react-native-select-dropdown";
import DocumentSelector from "../../components/PrepareDocument/DocumentSelector";
import RecipientSelector from "../../components/PrepareDocument/RecepientSelector";
import DocumentDiv from "./PrepareDocumentView/DocumentDiv";
import { FieldPayload } from "../../types/FieldTypes";
import HttpService from "../../utils/HttpService";
import apiEndpoints from "../../constants/apiEndpoints";
import useAuth from "../../utils/auth";
import CryptoHandler from "../../utils/EncryptDecryptHandler";
import { useToast } from "react-native-toast-notifications";
import {
  useDocuments,
  useEnvelope,
  usePdfData,
  useRecipients,
} from "../../utils/useReduxUtil";
import { isEmpty } from "lodash";
import { useDispatch } from "react-redux";
import {
  setEnvelopeStep,
  setIsLoading,
  setLoadingModal,
  setModalType,
  setshowEnvelopeUserWarningModal,
} from "../../redux/reducers/uiSlice";
import EnvelopeService from "../../services/EnvelopeService";
import { setCurrentPage, setRemoteFields } from "../../redux/reducers/PdfSlice";
import apiEndpoint from "../../constants/apiEndpoints";
import routes from "../../constants/routes";
import React from "react";
import { setSelecteDocument } from "../../redux/reducers/documentsSlice";
import { setselectedRecipients } from "../../redux/reducers/RecipientSlice";
import EnvelopeUserWarningModal from "../../components/modals/EnvelopeUserWarningModal";
interface PrepareDocumentProps {
  envelope: any;
  setEnvelope: any;
  // setCurrentStep: any;
  //setIsLoading: any;
  navigation: any;
}

const PrepareDocument: React.FC<PrepareDocumentProps> = ({
  //envelope,
  setEnvelope,
  navigation,
  // setCurrentStep,
  //setIsLoading,
}) => {
  const { recipients, selectedRecipient } = useRecipients();
  const dispatch = useDispatch();
  const recipientsList = recipients?.filter((list) => list?.type === "SIGNER");
  const { token } = useAuth();
  const envelope = useEnvelope();
  const { documents, SelectedDocuments } = useDocuments();
  const [selectedField, setSelectedField] = useState<any>(null);
  const toast = useToast();
  const fieldTypes = [
    {
      name: "Intials",
      type: "initial",
      icon: <GetSvg name="pencilIcon" classN="w-5 h-5" />,
      width: 200,
      height: 100,
      iconName: "pencilIcon",
    },
    {
      name: "Signature",
      type: "signature",
      icon: <GetSvg name="signatureIcon" classN="w-5 h-5" />,
      width: 200,
      height: 100,
      iconName: "signatureIcon",
    },
    {
      name: "Stamp",
      type: "stamp",
      icon: <GetSvg name="stampIcon" classN="w-5 h-5" strokeWidth={2} />,
      width: 200,
      height: 100,
      iconName: "stampIcon",
    },
    {
      name: "Text",
      type: "text",
      icon: <Text className="font-semibold text-base leading-5">Aa</Text>,
      width: 200,
      height: 100,
      iconName: "Aa",
    },
    {
      name: "Date",
      type: "date",
      icon: <GetSvg name="dateIcon" classN="w-5 h-5" />,
      width: 200,
      height: 100,
      iconName: "dateIcon",
    },
    {
      name: "Time",
      type: "time",
      icon: <GetSvg name="timeIcon" classN="w-5 h-5" />,
      width: 200,
      height: 100,
      iconName: "timeIcon",
    },
  ];

  // useEffect(() => {
  //   if (token && envelope) {
  //     HttpService.get(apiEndpoints.getEnvelope(envelope?.id), {
  //       token: token ?? "",
  //     }).then((res) => {
  //       const data = CryptoHandler.response(res, token ?? "");
  //       const updatedFields = data.fields?.map((d: any, i: any) => {
  //         const v = d?.response_payload;
  //         const newData = { ...v, id: d?.id };
  //         return newData;
  //       });
  //       //setAddedFields(updatedFields);
  //       console.log("ENEV", updatedFields);
  //       setEnvelope(data);
  //     });
  //   }
  // }, []);

  const handleSubmitFields = () => {
    //setIsLoading(true);
    // HttpService.put(apiEndpoints.submitEnvelopeFields(envelope?.id), {
    //   body: JSON.stringify({ fields: addedFields }),
    //   token: token ?? "",
    // }).then((res) => {
    //   if (res?.status) {
    //     //setCurrentStep(3);
    //     // setIsLoading(false);
    //   }
    // });
  };
  const handleSubmit = async (fields: any) => {
    // setIsLoading(true);
    if (!isEmpty(fields)) {
      dispatch(setshowEnvelopeUserWarningModal(false));
      dispatch(setIsLoading(true));
      await HttpService.post(apiEndpoint.fields.addFields(envelope?.id), {
        token: token,
        body: JSON.stringify({
          fields: fields,
        }),
      })
        .then((res) => {
          if (res?.success) {
            toast.show(res?.message, { type: "success" });
            dispatch(setRemoteFields(res?.data));
            dispatch(setEnvelopeStep(3));
            dispatch(setIsLoading(false));
          } else {
            toast.show(res?.message, { type: "error" });
            dispatch(setIsLoading(false));
          }
        })
        .catch((err) => {});

      // if (response) {
      //   dispatch(setRemoteFields(data));
      //   dispatch(setEnvelopeStep(3));
      //   dispatch(setIsLoading(false));
      // } else {
      //   dispatch(setIsLoading(false));
      // }
    } else {
      toast.show("Please add atleast 1 field to the document", {
        type: "error",
      });
    }
  };
  // console.log("SLECTED  DOCUMENT:", SelectedDocuments);
  const { addedFields } = usePdfData();
  // useEffect(() => {
  //   dispatch(setIsLoading(false));
  // }, []);
  const recipientsFieldList = addedFields?.map((u: any) => {
    return u?.meta?.email;
  });
  const isAllUserFieldAdded = recipients?.filter((s) => {
    return !recipientsFieldList?.includes(s?.user?.email);
  });
  console.log("selected doc", SelectedDocuments);
  const { totalPages, currentPage } = usePdfData();
  return (
    <React.Fragment>
      <View className="w-full h-[90%]">
        <View className="flex flex-row w-full justify-between items-center">
          <View className="w-[48%]">
            <Text className="px-2 py-1 text-xs">Select Recipient</Text>
            {recipients && (
              <RecipientSelector
                recipients={recipients}
                selectedRecipient={selectedRecipient}
                setSelectedRecipient={(e: any) => {
                  dispatch(setselectedRecipients(e?.option));
                }}
              />
            )}
          </View>
          <View className="w-[48%]">
            <Text className="px-2 py-1 text-xs">Select Document</Text>
            {documents && (
              <DocumentSelector
                selectedDocument={SelectedDocuments}
                setSelectedDocument={(e: any) => {
                  dispatch(setSelecteDocument(e?.option));
                }}
                documents={documents}
              />
            )}
          </View>
        </View>
        <View className="w-full max-w-sm mx-auto h-10 my-3 flex flex-row justify-around items-center">
          {fieldTypes?.map((f) => {
            return (
              <TouchableOpacity
                key={f.name}
                onPress={() => setSelectedField(f)}
                className=" border border-gray-300 rounded-full justify-center items-center p-2"
              >
                {f?.icon}
              </TouchableOpacity>
            );
          })}
        </View>
        <View className="w-full  ">
          <DocumentDiv
            envelope={envelope}
            setEnvelope={setEnvelope}
            // setCurrentStep={setCurrentStep}
            selectedRecipient={selectedRecipient}
            selectedDocument={SelectedDocuments}
            selectedField={selectedField}
            setSelectedField={setSelectedField}
            addedFields={addedFields ?? []}
            //setAddedFields={() => {}}
          />
        </View>
      </View>
      <View className=" w-full h-[10%] z-50 flex flex-row justify-between items-center mb-5">
        <TouchableOpacity
          onPress={() => {
            // setCurrentStep(1);
            if (envelope.self_sign) {
              dispatch(setEnvelopeStep(0));
              navigation.navigate(routes.dashboard);
            } else {
              dispatch(setEnvelopeStep(1));
            }
          }}
          className=" bg-slate-800 rounded-full p-1.5 px-4"
        >
          <Text className="text-white text-xs font-extrabold">Prev </Text>
        </TouchableOpacity>
        <GetSvg
          name="leftArrowIcon"
          classN="w-6 h-6 px-2 "
          color="#374151"
          callBack={() => {
            if (currentPage !== 1) {
              dispatch(setIsLoading(true));
              dispatch(setCurrentPage(currentPage - 1));
              setTimeout(() => dispatch(setIsLoading(false)), 2000);
              // setCurrentPageNumber(currentPageNumber - 1);
            }
          }}
        />
        <Text className="mx-5">
          Page {currentPage} of {totalPages}{" "}
        </Text>
        <GetSvg
          callBack={() => {
            if (currentPage !== totalPages) {
              dispatch(setIsLoading(true));
              dispatch(setCurrentPage(currentPage + 1));
              setTimeout(() => dispatch(setIsLoading(false)), 2000);
            }
          }}
          name="rightArrowIcon"
          classN="w-6 h-6 px-2"
          color="#374151"
        />
        <TouchableOpacity
          onPress={() => {
            if (!isEmpty(isAllUserFieldAdded) && !isEmpty(addedFields)) {
              dispatch(setshowEnvelopeUserWarningModal(true));
            } else {
              handleSubmit(addedFields);
            }
          }}
          className={`rounded-full  p-1.5 px-4 ${
            addedFields?.length ? "bg-[#d10000]" : "bg-[#ef9393]"
          }`}
        >
          <Text className="text-white text-xs font-extrabold ">Next </Text>
        </TouchableOpacity>
      </View>
      <EnvelopeUserWarningModal
        users={isAllUserFieldAdded?.map((u) => {
          return u?.user?.email;
        })}
        callBack={() => {
          handleSubmit(addedFields);
        }}
      />
    </React.Fragment>
  );
};
export default PrepareDocument;
