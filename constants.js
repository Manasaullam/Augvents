import imagePath from "./imagePath";
import { Image } from 'react-native';
//import { Ionicons } from "@expo/vector-icons";
//import { FontAwesome5 } from "@expo/vector-icons";
//import { MaterialCommunityIcons } from "@expo/vector-icons";
//import { FontAwesome } from "@expo/vector-icons";

const tabs = [
  {
    id: 1,
    name: "Today",
    icon: <Image source={imagePath.icDay} style={{ width: 30, height: 30 }} />,
  },
  {
    id: 2,
    name: "Week",
    icon: <Image source={imagePath.icWeek} style={{ width: 30, height: 30 }} />,
  },
  {
    id: 3,
    name: "Month",
    icon:<Image source={imagePath.icMonth} style={{ width: 30, height: 30 }} />,
  },
  {
    id: 4,
    name: "Calendar",
    icon: <Image source={imagePath.icCalendar} style={{ width: 30, height: 30 }} />,
  },
  {
    id: 5,
    name: "Search",
    icon: <Image source={imagePath.icSearch} style={{ width: 30, height: 30 }} />,
  },
];

 

const team = [
  {
    id: 11,
    name: "Jerry W.",
    role: "Designer",
    image: imagePath.icMan9,
  },
  {
    id: 1,
    name: "Pravallika",
    role: "Developer",
    image: imagePath.icLady1,
  },
  {
    id: 2,
    name: "Anuhya",
    role: "Developer",
    image: imagePath.icLady2,
  },
  {
    id: 3,
    name: "Binish",
    role: "Developer",
    image: imagePath.icLady3,
  },
  {
    id: 4,
    name: "Aakanksha",
    role: "Developer",
    image: imagePath.icLady4,
  },
  {
    id: 5,
    name: "Tram",
    role: "Developer",
    image: imagePath.icMan1,
  },
  {
    id: 6,
    name: "Zachary",
    role: "Developer",
    image: imagePath.icMan5,
  },
  {
    id: 7,
    name: "Alex",
    role: "Developer",
    image: imagePath.icMan3,
  },
  {
    id: 8,
    name: "Mitch",
    role: "Developer",
    image: imagePath.icMan4,
  },
  {
    id: 9,
    name: "Brandon",
    role: "Developer",
    image: imagePath.icMan7,
  },
  {
    id: 10,
    name: "Thang",
    role: "Developer",
    image: imagePath.icMan6,
  },
];

export default {
  tabs,
  team,
};
