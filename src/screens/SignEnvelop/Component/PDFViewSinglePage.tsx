import { useState } from "react";
import { Dimensions, Text, View, Image } from "react-native";
import { PdfView } from "react-native-pdf-light";
import { useToast } from "react-native-toast-notifications";
import ApiConfig from "../../../constants/ApiConfig";
import {
  FieldPayload,
  FILLEDDATATYPE,
  PageFieldType,
} from "../../../types/FieldTypes";
import { rgbToHex } from "../../../utils/colorUtil";
import GetSvg from "../../../utils/GetSvg";
import renderFieldIcon from "../../../utils/renderFieldIcon";

interface PDFViewSinglePageProps {
  pageNumber: number;
  source: any;
  handlePageLoad: any;
  fields: any;
}
const PDFViewSinglePage: React.FC<PDFViewSinglePageProps> = ({
  pageNumber,
  source,
  handlePageLoad,
  fields,
}) => {
  const [containerSize, setContainerSize] = useState({
    height: Dimensions.get("screen").height * 2,
    width: Dimensions.get("screen").width * 2,
  });
  const [actualPageSize, setActualPageSize] = useState({ height: 0, width: 0 });
  const toast = useToast();

  const resolveSize = (height: number, width: number) => {
    let maxAllowedWidth = Dimensions.get("screen").width * 0.88;
    let diffPercent =
      width - maxAllowedWidth != 0
        ? ((maxAllowedWidth - width) / width) * 100
        : 0;
    let containerWidth = maxAllowedWidth;
    let containerHeight = height + height * (diffPercent / 100);
    return { height: containerHeight, width: containerWidth };
  };
  //console.log("CONTAINER SDFGHJ:", fields, pageNumber);
  const renderFilledDiv = (type: FILLEDDATATYPE, data: any, width?: number) => {
    const value = data?.value;
    switch (type) {
      case "date":
      case "time":
      case "text":
        return (
          <View
            style={{
              width: "100%",
              height: "100%",
              // borderStyle: "dashed",
              // borderWidth: 1,
              // borderColor: data?.response_payload?.rgbaColor,
            }}
            className="flex justify-center items-start"
          >
            <Text
              numberOfLines={1}
              style={{ fontSize: (width ?? 0) / 10 }}
              className="w-full"
            >
              {value}
            </Text>
          </View>
        );
      case "initial":
      case "stamp":
      case "signature":
        return (
          <Image
            className="w-full h-full"
            resizeMode="contain"
            source={{
              uri: value,
            }}
          />
        );
    }
  };
  return (
    <View
      key={pageNumber}
      className="relative bg-white border border-gray-300 my-2 mx-auto"
      style={{ height: containerSize?.height, width: containerSize?.width }}
    >
      <View className="w-full h-full">
        <PdfView
          source={source}
          page={pageNumber}
          onLoadComplete={(e: any) => {
            setContainerSize(resolveSize(e?.height, e?.width));
            setActualPageSize({ height: e?.height, width: e?.width });
            handlePageLoad(e);
          }}
          style={{
            position: "absolute",
            zIndex: 1,
            height: "100%",
            width: "100%",
          }}
          onError={(e) => {
            toast.hideAll();
            toast.show(
              "Failed to open document please try with different document",
              { type: "error" }
            );
           // console.log("Error:", e);
          }}
        />
      </View>
      <View
        className="absolute  z-10"
        style={{ height: containerSize?.height, width: containerSize?.width }}
      >
        {fields
          ? fields?.map((f: any) => {
              const i: FieldPayload = f?.meta;
              const dpw =
                ((containerSize.width - Number(i?.dispalypagewidth)) /
                  Number(i?.dispalypagewidth)) *
                100;
              const dph =
                ((containerSize.height - Number(i?.displaypageheight)) /
                  Number(i?.displaypageheight)) *
                100;
              const width = i?.width + (dpw / 100) * i?.width;
              const height = i?.height + (dph / 100) * i?.height;
              const yCord = i?.yCord + (dph / 100) * i?.yCord;
              const xCord = i?.xCord + (dpw / 100) * i?.xCord;

              let fixedFieldFontSize = 0;
              if (width / 3 > height) {
                fixedFieldFontSize = height / 12;
              } else {
                fixedFieldFontSize = width / 12;
              }
              return (
                <View
                  className="absolute"
                  key={f?.id}
                  style={{
                    transform: [
                      { translateX: xCord ?? 0 },
                      { translateY: yCord ?? 0 },
                    ],
                    height: height,
                    width: width,
                  }}
                >
                  {f?.value ? (
                    renderFilledDiv(f?.meta?.type, f, width)
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        // backgroundColor: "blue",
                        borderStyle: "dashed",
                        borderWidth: 1.8,
                        borderColor: f?.meta?.rgbaColor,
                        // backgroundColor: i?.rgbaColor+'e1',
                      }}
                      className="relative bg-[#ffffffe1] flex flex-row"
                    >
                      <View className="w-1/4 justify-center items-center">
                        {f?.meta?.type === "text" ? (
                          <Text className=" text-base leading-5">
                            Aa
                          </Text>
                        ) : (
                          <GetSvg
                            name={renderFieldIcon(f?.meta?.type) ?? ""}
                            classN={`"w-${width+"px"} h-${height+"px"}"`}
                            color={f?.meta?.rgbaColor}
                          />
                        )}
                      </View>
                      <View className="w-3/4 items-start justify-center">
                        <Text
                          style={{
                            fontSize: fixedFieldFontSize * 1.2,
                          }}
                          className="capitalize w-full font-semibold text-gray-900"
                          numberOfLines={1}
                        >
                          {f?.meta?.name ?? "name"}
                        </Text>
                        <Text
                          style={{
                            fontSize: fixedFieldFontSize,
                          }}
                          className="capitalize font-semibold w-full text-gray-600"
                          numberOfLines={1}
                        >
                          {f?.meta?.email ?? "email"}
                        </Text>
                        <Text
                          style={{
                            fontSize: fixedFieldFontSize * 0.8,
                          }}
                          className="capitalize w-full font-medium text-gray-500"
                          numberOfLines={1}
                        >
                          {f?.meta?.type}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          : null}
      </View>
    </View>
  );
};

export default PDFViewSinglePage;
