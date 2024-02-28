import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import React, { createRef, useEffect, useRef, useState } from "react";
import MapView, { PROVIDER_GOOGLE, Marker, Circle } from "react-native-maps";
import styles from "./styles";
import imagePath from "../../constants/imagePath";
import Slider from "@react-native-community/slider";
import colors from "../../styles/colors";
import constants from "../../constants/constants";
import { Calendar } from "react-native-calendars";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
} from "expo-location";
import navigationStrings from "../../constants/navigationStrings";
import FilterModal from "./FilterModal";
import Modal from "react-native-modal";
import { FontAwesome5 } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { fetchEvents } from "../../services/api";
import { GOOGLE_MAPS_API } from "../../config/google";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { textScale } from "../../styles/responsiveSize";
import Geocoder from "react-native-geocoding";
import { Feather } from "@expo/vector-icons";
import { showMessage, hideMessage } from "react-native-flash-message";
import TodayModal from "./TodayModal";
import WeekModal from "./WeekModal";
import MonthModal from "./MonthModal";
import MapViewDirections from "react-native-maps-directions";
import { useTranslation } from "react-i18next";
import { Picker } from "@react-native-picker/picker";


const MapScreen = ({ navigation, route }) => {
  // params
  const selectedEvent = route?.params?.item;

  // States
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openMenuModle, setOpenMenuModle] = useState(false);
  /*const [on, setOn] = useState(true);
  const [off, setOff] = useState(false);*/
  const [inKm, setInKm] = useState(true);
  const [inMiles, setInMiles] = useState(false);
  const [switchMap, setSwitchMap] = useState(false);
  const [calendarModal, setCalendarModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalWithOptions, setModalWithOptions] = useState(false);
  const [todaySelect, setTodaySelect] = useState(false);
  const [weekSelect, setWeekSelect] = useState(false);
  const [monthSelect, setMonthSelect] = useState(false);
  const [filteredDataModal, setFilteredDataModal] = useState(false);
  const [mapType, setMapType] = useState("standard");
  const [miles, setMiles] = useState(0);
  const [kilometer, setKilometer] = useState(0);
  const [latOfDetails, setLatOfDetails] = useState(0);
  const [lngOfDetails, setLngOfDetails] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsCopy, setEventsCopy] = useState([]);
  const [selectedEventLatLng, setSelectedEventLatLng] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  //const [isGerman, setIsGerman] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en'); // Default language



  // Variables
  const mapViewRef = useRef(null);
  const testRef = createRef()
  const googleKey = GOOGLE_MAPS_API;
  const { width, height } = Dimensions.get("window");
  const ASPECT_RATIO = width / height;
  const LATITUDE_DELTA = Platform.OS === "ios" ? 1.5 : 0.5;
  const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
  const factor = inKm ? kilometer / 15 : miles / 15;
  const markedDates = {};
  const { t, i18n } = useTranslation();

  useEffect(() => {
    (async () => {
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      const location = await getCurrentPositionAsync({});
      setUserLocation(location.coords);

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
    })();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      handleSelectedEventAddress();
    }
  }, [selectedEvent]);

  useEffect(() => {
    Geocoder.init(googleKey);
    const fetchDataAndUpdateLocations = async () => {
      try {
        const data = await fetchEvents();
        const metaObjects = data.map((item) => item.meta);
        await updateEventLocations(metaObjects);
        setEvents(metaObjects);
      } catch (error) {
        showMessage({
          message: "Something went wrong",
          type: "danger",
          duration: 2000,
        });
      }
    };

    fetchDataAndUpdateLocations();
  }, []);

  useEffect(() => {
    if (mapViewRef.current && userLocation) {
      const newRegion = {
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        latitudeDelta: LATITUDE_DELTA * factor,
        longitudeDelta: LONGITUDE_DELTA * factor,
      };
      mapViewRef.current.animateToRegion(newRegion, 2000);
    }
  }, [miles, kilometer]);

  events.forEach((event) => {
    const startDate = event.start_date;
    markedDates[startDate] = { marked: true };
  });

  // Handler

  const filterEventsByDay = (selectedDay) => {
    setCalendarModal(false);
    const filtered = events.filter((event) => {
      const eventDate = event.start_date;
      return eventDate === selectedDay.dateString;
    });

    navigation.navigate(navigationStrings.EVENTS, {
      filteredDataFromCalendar: filtered,
    });
  };

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
  };

  const handleFilterData = (filteredData) => {
    if (filteredData) {
      navigation.navigate(navigationStrings.EVENTS, {
        filteredData: filteredData,
      });
    }
  };

  const geocodeAddress = async (address) => {
    try {
      const response = await Geocoder.from(address);
      const location = response.results[0].geometry.location;
      return location;
    } catch (error) {
      console.warn(`Geocoding error for address ${address}:`, error);
      return null;
    }
  };

  const handleSelectedEventAddress = async () => {
    const { event_address, event_city, event_state } = selectedEvent;
    const fullAddress = `${event_address}, ${event_city}, ${event_state}`;
    const location = await geocodeAddress(fullAddress);
    mapViewRef.current.animateToRegion({
      latitude: location.lat,
      longitude: location.lng,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
    setSelectedEventLatLng(location);
  };

  const updateEventLocations = async (meta) => {
    await Promise.all(
      meta.map(async (event) => {
        const { event_address, event_city, event_state } = event;
        const fullAddress = `${event_address}, ${event_city}, ${event_state}`;
        const location = await geocodeAddress(fullAddress);

        if (location) {
          setEventsCopy((events) => [
            ...events,
            {
              ...event,
              lat: location?.lat,
              lng: location?.lng,
            },
          ]);
        } else {
          Alert.alert("Error", "Could not find location for event");
        }
      })
    );
  };

  const returnToUserLocation = () => {
    testRef.current.clear()
    inKm ? setKilometer(0) : setMiles(0);
    if (userLocation) {
      mapViewRef.current?.animateToRegion({
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  const handleMapChange = () => {
    inKm ? setKilometer(0) : setMiles(0);
    if (switchMap) {
      setMapType("standard");
    } else {
      setMapType("satellite");
    }
    setSwitchMap(!switchMap);
  };

  const handleFeedback = () => {
    setOpenMenuModle(false);
    navigation.navigate(navigationStrings.FEEDBACK);
  };

  const handleAbout = () => {
    setOpenMenuModle(false);
    navigation.navigate(navigationStrings.ABOUT);
  };

  const handleTutorial = () => {
    setOpenMenuModle(false);
    navigation.navigate(navigationStrings.TUTORIAL);
  };

  const handleRate = () => {
    setOpenMenuModle(false);
    navigation.navigate(navigationStrings.RATE);
  };

  const handleSearchBar = () => {
    return (
      <View style={styles.searchBarCont}>
        <GooglePlacesAutocomplete 
          ref = {testRef}
          styles={{
            textInputContainer: {
              width: "98%",
            },
            textInput: {
              fontSize: textScale(15),
            },
          }}
          fetchDetails={true}
          placeholder={t("Search")}
          onPress={(data, details = null) => {
            if (details) {
              const { lat, lng } = details.geometry.location;
              setLatOfDetails(lat);
              setLngOfDetails(lng);
              mapViewRef.current.animateToRegion({
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              });
            }
          }}
          query={{
            key: googleKey,
            language: "en",
          }}
        />
        <TouchableOpacity
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.8}
          style={styles.filterCont}
        >
          <AntDesign name="filter" size={24} color="black" />
        </TouchableOpacity>
      </View>
    );
  };

  const handleMapFunctionalities = () => {
    return (
      <View style={styles.mapFunctionalities}>
        <TouchableOpacity activeOpacity={0.8} onPress={handleMapChange}>
          {mapType === "satellite" ? (
            <FontAwesome
              name="map"
              size={26}
              color="black"
              style={styles.iconSize}
            />
          ) : (
            <FontAwesome
              name="map-o"
              size={26}
              color="black"
              style={styles.iconSize}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} onPress={returnToUserLocation}>
          <FontAwesome5
            name="location-arrow"
            size={26}
            color="black"
            style={styles.iconSize}
          />
        </TouchableOpacity>
        {/* <TouchableOpacity activeOpacity={0.8} onPress={zoomIn}>
          <Feather
            name="zoom-in"
            size={26}
            color="black"
            style={styles.iconSize}
          />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={zoomOut}>
          <Feather
            name="zoom-out"
            size={26}
            color="black"
            style={styles.iconSize}
          />
        </TouchableOpacity> */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate(navigationStrings.EVENTS)}
        >
          <MaterialCommunityIcons
            name="dots-grid"
            size={26}
            color="black"
            style={styles.iconSize}
          />
        </TouchableOpacity>
      </View>
    );
  };

  /*const handleEnglish = () => {
    setOn(true); // Set English to true
    setOff(false); // Set Spanish to false
    setIsGerman(false); // Set German to false
    i18n.changeLanguage('en'); // Change language to English
  };
  
  const handleSpanish = () => {
    setOn(false); // Set English to false
    setOff(true); // Set Spanish to true
    setIsGerman(false); // Set German to false
    i18n.changeLanguage('es'); // Change language to Spanish
  };
  
  const handleGerman = () => {
    setOn(false);       // Set English to false
    setOff(false);      // Set Spanish to false
    setIsGerman(true);  // Set German to true
    i18n.changeLanguage('de');
  };*/

  const handleModal = () => {
    return (
      <Modal
        onBackdropPress={() => setOpenMenuModle(false)}
        isVisible={openMenuModle}
      >
        <View style={styles.modalView}>
          {/* Language */}
          <View style={styles.item1}>
            <Text style={styles.headingTitle}>{t("Language")}</Text>
            <View style={styles.switchCont}>
              <Picker
                selectedValue={selectedLanguage}
                style={ styles.pickerStyle } // Set background color to transparent
                onValueChange={(itemValue, itemIndex) => {
                 setSelectedLanguage(itemValue);
                 i18n.changeLanguage(itemValue);
              }}
            >
              <Picker.Item label="English" value="en" />
              <Picker.Item label="Spanish" value="es" />
              <Picker.Item label="German" value="de" />
              {/* Add more languages here */}
             </Picker>

            </View>
          </View>
          {/* Measure */}
          <View style={styles.item1}>
            <Text style={styles.headingTitle}>{t("Measure")}</Text>
            <View style={styles.switchCont}>
              <TouchableOpacity
                onPress={() => {
                  setInKm(true), setInMiles(false);
                }}
                style={[
                  styles.onStyle,
                  {
                    backgroundColor: inKm ? colors.white : null,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.keyText,
                    {
                      color: inKm ? colors.black : colors.white,
                    },
                  ]}
                >
                  Km
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setInKm(false), setInMiles(true);
                }}
                style={[
                  styles.onStyle,
                  { backgroundColor: inMiles ? colors.white : null },
                ]}
              >
                <Text
                  style={[
                    styles.keyText,
                    {
                      color: inMiles ? colors.black : colors.white,
                    },
                  ]}
                >
                  Mi
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Rate App */}
          <TouchableOpacity
            onPress={handleRate}
            activeOpacity={0.8}
            style={styles.commonLayout}
          >
            <Text style={styles.headingTitle}>{t("Rate App")}</Text>
            <Image
              resizeMode="contain"
              source={imagePath.icRightArrow}
              style={styles.arrow}
            />
          </TouchableOpacity>
          {/* FeedBack */}
          <TouchableOpacity
            onPress={handleFeedback}
            activeOpacity={0.8}
            style={styles.commonLayout}
          >
            <Text style={styles.headingTitle}>{t("Feedback")}</Text>
            <Image
              resizeMode="contain"
              source={imagePath.icRightArrow}
              style={styles.arrow}
            />
          </TouchableOpacity>
          {/* Share App */}
          <TouchableOpacity activeOpacity={0.8} style={styles.commonLayout}>
            <Text style={styles.headingTitle}>{t("Share App")}</Text>
            <Image
              resizeMode="contain"
              source={imagePath.icRightArrow}
              style={styles.arrow}
            />
          </TouchableOpacity>
          {/* About */}
          <TouchableOpacity
            onPress={handleAbout}
            activeOpacity={0.8}
            style={styles.commonLayout}
          >
            <Text style={styles.headingTitle}>{t("About")}</Text>
            <Image
              resizeMode="contain"
              source={imagePath.icRightArrow}
              style={styles.arrow}
            />
          </TouchableOpacity>
          {/* Tutorial */}
          <TouchableOpacity
            onPress={handleTutorial}
            activeOpacity={0.8}
            style={[
              styles.commonLayout,
              {
                borderBottomWidth: 0,
              },
            ]}
          >
            <Text style={styles.headingTitle}>{t("Tutorial")}</Text>
            <Image
              resizeMode="contain"
              source={imagePath.icRightArrow}
              style={styles.arrow}
            />
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  const handleCalendar = () => {
    return (
      <Modal
        onBackdropPress={() => setCalendarModal(false)}
        isVisible={calendarModal}
      >
        <View style={styles.modalView}>
          <Calendar
            onDayPress={(day) => {
              console.log("selected day", day.dateString);
              filterEventsByDay(day);
            }}
            markedDates={markedDates}
          />
        </View>
      </Modal>
    );
  };

  const zoomIn = () => {
    inKm ? setKilometer(0) : setMiles(0);
    const newRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta * 0.0922,
      longitudeDelta: region.longitudeDelta * 0.0421,
    };

    mapViewRef.current.animateToRegion(newRegion, 300);
    setRegion(newRegion);
  };

  const zoomOut = () => {
    inKm ? setKilometer(0) : setMiles(0);
    const newRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta * 2,
      longitudeDelta: region.longitudeDelta * 2,
    };

    mapViewRef.current.animateToRegion(newRegion, 300);
    setRegion(newRegion);
  };

  const handleEventMarkerPress = (event) => {
    setIsLoading(true);
    setRegion({
      latitude: event.lat,
      longitude: event.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    navigation.navigate(navigationStrings.EVENTDETAILS,{
      item:event
    })
    // if (mapViewRef.current) {
    //   mapViewRef.current.animateToRegion({
    //     latitude: event.lat,
    //     longitude: event.lng,
    //     latitudeDelta: 0.01,
    //     longitudeDelta: 0.01,
    //   });
    // }
    setIsLoading(false);
  };

  const getCircleRadius = () => {
    return inKm ? kilometer * 1000 : miles * 1609.34;
  };

  const handleMonthPress = async (item) => {
    const { event_address, event_city, event_state } = item;
    const fullAddress = `${event_address}, ${event_city}, ${event_state}`;
    const location = await geocodeAddress(fullAddress);

    if (mapViewRef.current && location) {
      const newRegion = {
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: LATITUDE_DELTA * (miles / 15),
        longitudeDelta: LONGITUDE_DELTA * (miles / 15),
      };
      mapViewRef.current.animateToRegion(newRegion, 2000);
      setMonthSelect(false);
    } else {
      Alert.alert("Error", "Could not find location for event");
    }
  };

  const handleTodayPress = async (item) => {
    const { event_address, event_city, event_state } = item;
    const fullAddress = `${event_address}, ${event_city}, ${event_state}`;
    const location = await geocodeAddress(fullAddress);

    if (mapViewRef.current && location) {
      const newRegion = {
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: LATITUDE_DELTA * (miles / 15),
        longitudeDelta: LONGITUDE_DELTA * (miles / 15),
      };
      mapViewRef.current.animateToRegion(newRegion, 2000);
      setTodaySelect(false);
    } else {
      Alert.alert("Error", "Could not find location for event");
    }
  };

  const handleWeekPress = async (item) => {
    const { event_address, event_city, event_state } = item;
    const fullAddress = `${event_address}, ${event_city}, ${event_state}`;
    const location = await geocodeAddress(fullAddress);

    if (mapViewRef.current && location) {
      const newRegion = {
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: LATITUDE_DELTA * (miles / 15),
        longitudeDelta: LONGITUDE_DELTA * (miles / 15),
      };
      mapViewRef.current.animateToRegion(newRegion, 2000);
      setWeekSelect(false);
    } else {
      Alert.alert("Error", "Could not find location for event");
    }
  };

  const userCurrentLocation = {
    latitude: userLocation?.latitude,
    longitude: userLocation?.longitude,
  };

  const handleGetDirections = () => {
    return (
      <>
        <MapViewDirections
          origin={userCurrentLocation}
          waypoints={[{ latitude: latOfDetails, longitude: lngOfDetails }]}
          destination={{
            latitude: latOfDetails,
            longitude: lngOfDetails,
          }}
          apikey={googleKey}
          optimizeWaypoints={true}
          strokeWidth={4}
          strokeColor={colors.logoColor}
          onError={(errorMessage) => {
            showMessage({
              message: errorMessage,
              type: "danger",
              duration: 2000,
            });
          }}
          onReady={(result) => {
            const { distance, duration } = result;
            mapViewRef.current.fitToCoordinates(result.coordinates, {
              edgePadding: {
                right: width / 20,
                bottom: height / 20,
                left: width / 20,
                top: height / 20,
              },
            });
          }}
        />
      </>
    );
  };

  const handleCircleRadius = () => {
    return (
      <Circle
        center={{
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
        }}
        radius={getCircleRadius()}
        fillColor="rgba(0, 128, 255, 0.3)"
        strokeColor="blue"
        strokeWidth={2}
      />
    );
  };

  const getCustomMarkerIcon = (eventType) => {
    switch (eventType) {
      case "Visual arts":
        return imagePath.icVisualArts;
      case "Performing arts":
        return imagePath.icPerformingArts;
      case "literature":
        return imagePath.icLiterature;
      default:
        return imagePath.icLiterature;
    }
  };
  // Renderers

  function renderHeader() {
    return (
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setOpenMenuModle(true)}
        >
          <Image source={imagePath.icMenu} style={styles.menuIcon} />
        </TouchableOpacity>
        <View style={styles.layout}>
          <Image source={imagePath.icLogo} style={styles.logo} />
        </View>
      </View>
    );
  }

  function renderMaps() {
    return (
      <>
        <MapView
          style={styles.map}
          ref={mapViewRef}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          mapType={mapType}
          showsUserLocation={true}
        >
          {userLocation && handleCircleRadius()}

          {latOfDetails !== 0 && lngOfDetails !== 0 && (
            <Marker
              coordinate={{
                latitude: latOfDetails,
                longitude: lngOfDetails,
              }}
            />
          )}
          {eventsCopy.map((event, index) => (
            <Marker
              key={`event-${index}`}
              coordinate={{
                latitude: event.lat,
                longitude: event.lng,
              }}
              title={event.event_title}
              onPress={() => handleEventMarkerPress(event)}
            >
              {event.type_of_art_event === "Visual arts" ? (
                <Image
                  source={imagePath.icVisualArts}
                  style={styles.markerStyle}
                />
              ) : event.type_of_art_event === "Performing arts" ? (
                <Image
                  source={imagePath.icPerformingArts}
                  style={styles.markerStyle}
                />
              ) : (
                <Image
                  source={imagePath.icLiterature}
                  style={styles.markerStyle}
                />
              )}
            </Marker>
          ))}
          {selectedEventLatLng.lat && selectedEventLatLng.lng && (
            <Marker coordinate={selectedEventLatLng} />
          )}
        </MapView>

        {handleSearchBar()}
        {handleMapFunctionalities()}
      </>
    );
  }

  function renderFooter() {
    return (
      <View style={styles.footer}>
        {/* Slider */}
        <View style={styles.sliderContainer}>
          <Slider
            // onSlidingStart={handleRadius}
            value={inKm ? kilometer : miles}
            onValueChange={inKm ? setKilometer : setMiles}
            style={styles.sliderStyle}
            minimumValue={0}
            maximumValue={inKm ? 80 : 50}
            minimumTrackTintColor={colors.blue}
            maximumTrackTintColor={colors.grey}
          />
          {inKm ? (
            <Text style={styles.miles}>{kilometer.toFixed(2)} km</Text>
          ) : (
            <Text style={styles.miles}>{miles.toFixed(2)} mi</Text>
          )}
        </View>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          {constants.tabs.map((tab, index) => {
            const { icon, name } = tab;
            const tabStyle =
              index === activeTab ? styles.tabPressed : styles.tab;
            return (
              <TouchableOpacity
                key={index}
                style={tabStyle}
                onPress={() => {
                  setActiveTab(index);
                  if (index === 0) {
                    setTodaySelect(true);
                  } else if (index === 1) {
                    setWeekSelect(true);
                  } else if (index === 2) {
                    setMonthSelect(true);
                  } else if (index === 3) {
                    setCalendarModal(true);
                  }
                }}
              >
                {icon}
                <Text style={styles.tabText}>{t(name)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderMaps()}
      {renderFooter()}
      {showFilterModal && (
        <FilterModal
          isVisible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onFilterData={handleFilterData}
        />
      )}
      {openMenuModle && handleModal()}
      {calendarModal && handleCalendar()}
      {todaySelect && (
        <TodayModal
          isVisible={todaySelect}
          onClose={() => {
            setTodaySelect(false), setActiveTab(null);
          }}
          onPress={(item) => handleTodayPress(item)}
        />
      )}
      {weekSelect && (
        <WeekModal
          isVisible={weekSelect}
          onClose={() => {
            setWeekSelect(false), setActiveTab(null);
          }}
          onPress={(item) => handleWeekPress(item)}
        />
      )}
      {monthSelect && (
        <MonthModal
          isVisible={monthSelect}
          onClose={() => {
            setMonthSelect(false), setActiveTab(null);
          }}
          onPress={(item) => handleMonthPress(item)}
        />
      )}
    </View>
  );
};

export default MapScreen;
