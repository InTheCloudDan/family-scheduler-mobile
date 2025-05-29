import React, { useEffect, useState } from 'react';
// Import PermissionsAndroid separately
import { View, StyleSheet, ScrollView, Image, Alert, Platform, Permission, TouchableOpacity, Linking, FlatList } from 'react-native'; // Added Linking, FlatList
import { PermissionsAndroid } from 'react-native';
import { Text, Card, Title, Paragraph, Avatar, Chip, Subheading, Button, ActivityIndicator, IconButton, Snackbar, useTheme } from 'react-native-paper';
import Collapsible from 'react-native-collapsible'; // Import Collapsible
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Import Icon
import { StackScreenProps } from '@react-navigation/stack';
import { DashboardStackParamList } from '../../navigation/DashboardStackNavigator'; // Use the actual stack param list
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store'; // Assuming AppDispatch is exported from store/index.ts
import apiClient from '../../services/api'; // Import API client
import {
  fetchEventMedia,
  uploadEventMedia,
  deleteEventMedia,
  clearCurrentEventMedia,
  clearMediaError,
  clearUploadError,
  clearDeleteMediaError,
  selectCurrentEventMedia,
  selectIsMediaLoading,
  selectMediaError,
  selectIsUploadingMedia,
  selectUploadMediaError,
  selectIsDeletingMedia,
  selectDeleteMediaError,
  EventMedia, // Import the interface
} from '../../store/slices/eventsSlice';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker'; // Removed Asset
// Removed RootState import

// Define the props for this screen using StackScreenProps
type Props = StackScreenProps<DashboardStackParamList, 'EventDetail'>;

// Define the Restaurant type based on expected API response
interface Restaurant {
  id: string; // Assuming API provides a unique ID
  name: string;
  address: string;
  rating?: number | string; // Optional rating
  maps_url: string; // URL for linking
}

// Define styles *before* the component that uses them
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 10, // Padding moved to ScrollView contentContainerStyle if needed or keep here
  },
  scrollViewContainer: { // Added for ScrollView padding
     padding: 10,
     paddingBottom: 20, // Add padding at the bottom too
  },
  card: {
    marginBottom: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  description: {
    marginTop: 8,
    lineHeight: 20, // Improve readability
  },
  participantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  // Media Styles
  mediaListContainer: {
    marginTop: 10,
  },
  mediaItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Use theme color later if needed
  },
   mediaContent: {
    flex: 1, // Take available space
    marginRight: 10,
  },
  mediaImage: {
    width: 80, // Ensure explicit dimensions
    height: 80, // Ensure explicit dimensions
    borderRadius: 4,
    backgroundColor: '#f0f0f0', // Placeholder bg
  },
  mediaPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
   mediaFilename: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  mediaCaption: {
    marginTop: 5,
    fontSize: 13,
    fontStyle: 'italic',
    color: '#555', // Use theme color later
  },
  deleteButton: {
    // Minimal styling, position is handled by flexbox in container
  },
  addMediaButton: {
    marginTop: 15,
  },
  errorText: {
    marginTop: 10,
    textAlign: 'center',
  },
  // Nearby Restaurants Styles
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16, // Match Card padding
    // backgroundColor: '#f9f9f9', // Optional background
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  collapsibleHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  collapsibleContent: {
    padding: 16, // Match Card padding
  },
  restaurantListContainer: {
    marginTop: 10,
  },
});

// Define the RestaurantItem component
const RestaurantItem = ({ item }: { item: Restaurant }) => {
  const theme = useTheme(); // Access theme for styling if needed

  const handleMapLink = () => {
    if (item.maps_url) {
      Linking.openURL(item.maps_url).catch(err => {
        console.error('Failed to open map link:', err);
        Alert.alert('Error', 'Could not open the map link.');
      });
    }
  };

  return (
    <View style={itemStyles.container}>
      <View style={itemStyles.infoContainer}>
        <Text style={itemStyles.name}>{item.name}</Text>
        <Text style={itemStyles.address}>{item.address}</Text>
        {item.rating != null && <Text style={itemStyles.rating}>Rating: {item.rating}</Text>}
      </View>
      <TouchableOpacity onPress={handleMapLink} style={itemStyles.iconButton}>
        <Icon name="map-marker-outline" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

// Styles for RestaurantItem (separate for clarity)
const itemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0', // Lighter border
  },
  infoContainer: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    // fontWeight: 'bold', // Using default weight from Paper
  },
  address: {
    fontSize: 14,
    color: '#666', // Slightly darker grey
    marginTop: 3,
  },
  rating: {
    fontSize: 13,
    color: '#888', // Lighter grey
    marginTop: 3,
  },
  iconButton: {
    padding: 8, // Increase tap area
    marginLeft: 8,
  },
});


const EventDetailScreen = ({ route }: Props) => {
  const { event } = route.params; // Get the event object from route params
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();

  // --- Media State ---
  const mediaItems = useSelector(selectCurrentEventMedia);
  const isMediaLoading = useSelector(selectIsMediaLoading);
  const mediaError = useSelector(selectMediaError);
  const isUploading = useSelector(selectIsUploadingMedia);
  const uploadError = useSelector(selectUploadMediaError);
  const isDeletingMedia = useSelector(selectIsDeletingMedia);
  const deleteMediaError = useSelector(selectDeleteMediaError);

  // --- Nearby Restaurants State ---
  const [isExpanded, setIsExpanded] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
  const [restaurantsError, setRestaurantsError] = useState<string | null>(null);
  const [restaurantsLoaded, setRestaurantsLoaded] = useState(false); // Prevent re-fetch

  // --- Snackbar State ---
  const [mediaErrorVisible, setMediaErrorVisible] = useState(false);
  const [uploadErrorVisible, setUploadErrorVisible] = useState(false);
  const [deleteErrorVisible, setDeleteErrorVisible] = useState(false);
  const [restaurantErrorVisible, setRestaurantErrorVisible] = useState(false); // Snackbar for restaurant errors

  // Fetch media on mount and clear on unmount
  useEffect(() => {
    if (event?.id) {
      dispatch(fetchEventMedia({ eventId: event.id }));
    }
    // Cleanup function
    return () => {
      dispatch(clearCurrentEventMedia());
    };
  }, [dispatch, event?.id]);

  // Show Snackbars when errors occur
  useEffect(() => {
    if (mediaError) setMediaErrorVisible(true);
  }, [mediaError]);

  useEffect(() => {
    if (uploadError) setUploadErrorVisible(true);
  }, [uploadError]);

  useEffect(() => {
    if (deleteMediaError) setDeleteErrorVisible(true);
  }, [deleteMediaError]);

  useEffect(() => {
    if (restaurantsError) setRestaurantErrorVisible(true);
  }, [restaurantsError]);


  // Define AssociatedUser type locally or import if exported from slice
  // Re-defining here for clarity as it wasn't exported
  interface AssociatedUser {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  }

  // Helper function to get associated user display name
  const getUserName = (user: AssociatedUser) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || 'Unknown User';
  };

  // Helper function to get associated user initials
  const getUserInitials = (user: AssociatedUser) => {
    let initials = '';
    if (user.first_name) {
      initials += user.first_name[0];
    }
    if (user.last_name) {
      initials += user.last_name[0];
    }
    if (!initials && user.username) {
      initials = user.username[0];
    }
    return initials.toUpperCase();
  };

  // --- Map Linking Handler ---
  const handleOpenMap = async () => { // Make async for canOpenURL checks
    if (!event?.location) return;

    const locationQuery = encodeURIComponent(event.location);
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${locationQuery}`; // Web fallback

    // Define URLs for different apps
    const wazeUrl = `waze://?q=${locationQuery}&navigate=yes`;
    const googleMapsUrl = Platform.OS === 'ios' ? `comgooglemaps://?q=${locationQuery}` : `google.navigation:q=${locationQuery}`;
    const appleMapsUrl = `maps://?q=${locationQuery}`;
    const defaultAndroidUrl = `geo:0,0?q=${locationQuery}`;

    // Check which apps are available
    const canOpenWaze = await Linking.canOpenURL(wazeUrl);
    const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
    // On iOS, check Apple Maps; on Android, check the generic geo intent
    const canOpenDefault = Platform.OS === 'ios' ? await Linking.canOpenURL(appleMapsUrl) : await Linking.canOpenURL(defaultAndroidUrl);

    const options = [];

    // Add options based on availability
    if (canOpenDefault) {
        options.push({
            text: Platform.OS === 'ios' ? 'Apple Maps' : 'Default Map App',
            onPress: () => Linking.openURL(Platform.OS === 'ios' ? appleMapsUrl : defaultAndroidUrl).catch(err => {
                console.error('Failed to open default map:', err);
                Linking.openURL(webUrl); // Fallback to web
            }),
        });
    }
    if (canOpenGoogleMaps) {
         options.push({
            text: 'Google Maps',
            onPress: () => Linking.openURL(googleMapsUrl).catch(err => {
                console.error('Failed to open Google Maps:', err);
                Linking.openURL(webUrl); // Fallback to web
            }),
        });
    }
    if (canOpenWaze) {
        options.push({
            text: 'Waze',
            onPress: () => Linking.openURL(wazeUrl).catch(err => {
                console.error('Failed to open Waze:', err);
                Linking.openURL(webUrl); // Fallback to web
            }),
        });
    }

    // Always add Web fallback if no native apps detected or as an explicit option
     if (options.length === 0 || options.length > 1) { // Add web if no native or multiple native options
        options.push({
            text: 'Open in Browser',
            onPress: () => Linking.openURL(webUrl).catch(err => {
                 console.error('Failed to open web map:', err);
                 Alert.alert('Error', 'Could not open map in browser.');
            }),
        });
     }

    // Add Cancel button with explicit style type
    options.push({ text: 'Cancel', style: 'cancel' as 'cancel' }); // Explicitly type 'cancel'

    // Show options if more than one choice (including Cancel)
    if (options.length > 2) { // More than just Web/Default + Cancel
      Alert.alert(
        'Open Location In...',
        'Choose an application to open the address:',
        options,
        { cancelable: true }
      );
    } else if (options.length === 2 && options[0]?.text !== 'Cancel') { // Check if options[0] exists
      // Only one map app option + Cancel, just open it directly
      if (options[0].onPress) { // Add explicit check for onPress
         options[0].onPress();
      }
    } else {
      // Only Web + Cancel, or just Cancel
      // Attempt web if it's the only non-cancel option
      const webOption = options.find(opt => opt.text === 'Open in Browser');
      if (webOption?.onPress) { // Check if webOption and its onPress exist
          webOption.onPress();
      } else {
          console.log('No map options available or only Cancel.');
          // Optionally show an alert if even web fails?
          Alert.alert('No Map App', 'Could not find a suitable application to open the location.');
      }
    }
  };


  // --- Media Handlers ---

  // Function to request Android permissions
  const requestMediaPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true; // Permissions handled by Info.plist on iOS
    }

    try {
      // Check Android version for granular permissions
      const androidVersion = Platform.Version;
      // Use the imported Permission type for the array
      let permissionsToRequest: Permission[] = [];

      // Access constants directly from PermissionsAndroid object
      if (androidVersion >= 33) { // Android 13+
        permissionsToRequest = [
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        ];
      } else { // Older Android versions
        permissionsToRequest = [PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE];
      }

      // Call requestMultiple directly
      const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest);

      // Check if all requested permissions were granted using a loop
      let allGranted = true;
      for (const p of permissionsToRequest) {
          // Explicitly check the status for the permission key
          const permissionKey = p as keyof typeof granted; // Cast to satisfy TS index signature
          // Access RESULTS directly from PermissionsAndroid
          if (!granted[permissionKey] || granted[permissionKey] !== PermissionsAndroid.RESULTS.GRANTED) {
              allGranted = false;
              console.log(`Permission denied: ${permissionKey}`);
              break;
          }
      }


      if (allGranted) {
        console.log('Media permissions granted');
        return true;
      } else {
        console.log('Media permissions denied');
        Alert.alert('Permission Denied', 'Cannot access media library without permission.');
        return false;
      }
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  };


  const handleAddMedia = async () => { // Make async
    console.log('handleAddMedia called for event:', event?.id); // Log 1: Confirm handler is called

    const hasPermission = await requestMediaPermission();
    if (!hasPermission) {
      return; // Stop if permission denied
    }

    launchImageLibrary(
      {
        mediaType: 'mixed', // Allow photos and videos
        quality: 0.7, // Adjust quality as needed
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.error('ImagePicker Error: ', response.errorMessage);
          Alert.alert('Error', 'Could not select media. Please check permissions.');
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          if (asset.uri && asset.fileName && asset.type && event?.id) {
            // TODO: Optionally prompt for caption here
            dispatch(uploadEventMedia({
              eventId: event.id,
              fileUri: asset.uri,
              fileName: asset.fileName,
              fileType: asset.type,
              // caption: 'Optional caption'
            }));
          } else {
             // Log 3: Missing asset properties
             console.error('ImagePicker Error: Missing asset properties.', { uri: asset.uri, fileName: asset.fileName, type: asset.type, eventId: event?.id });
             Alert.alert('Error', 'Selected media is missing required information.');
          }
        } else {
            // Log 4: Unexpected response structure
            console.error('ImagePicker Error: Unexpected response structure', response);
            Alert.alert('Error', 'Could not process selected media.');
        }
      }
    );
  };

  const handleDeleteMedia = (mediaId: number) => {
    Alert.alert(
      'Delete Media',
      'Are you sure you want to delete this media item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteEventMedia({ mediaId })),
        },
      ]
    );
  };

  // --- Nearby Restaurants Handler ---
  const fetchNearbyRestaurants = async () => {
    if (!event?.id || restaurantsLoaded) {
      return; // Don't fetch if no event ID or already loaded
    }

    console.log(`Fetching nearby restaurants for event ${event.id}`);
    setIsLoadingRestaurants(true);
    setRestaurantsError(null);

    try {
      // Corrected URL path with 'api/' prefix
      const response = await apiClient.get<{ results: Restaurant[] }>(`/events/${event.id}/nearby-restaurants/`);
      // Assuming the API returns data in a 'results' field like other paginated endpoints, even if not paginated itself. Adjust if needed.
      setRestaurants(response.data.results || response.data); // Handle both cases
      setRestaurantsLoaded(true); // Mark as loaded
    } catch (error: any) {
      console.error('Error fetching nearby restaurants:', error);
      let errorMessage = 'Could not fetch nearby restaurants.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setRestaurantsError(errorMessage);
    } finally {
      setIsLoadingRestaurants(false);
    }
  };

  const handleToggleExpand = () => {
    const nextExpandedState = !isExpanded;
    setIsExpanded(nextExpandedState);
    if (nextExpandedState && !restaurantsLoaded) {
      fetchNearbyRestaurants();
    }
  };


  // --- Render Logic ---

  // No need for loading/error state here as data is passed directly for the event itself
  if (!event) {
    return <Text style={styles.centered}>Event data not found.</Text>;
  }

  const renderMediaItem = (item: EventMedia) => {
    // Log the URL being used
    console.log(`Rendering media item ${item.id} (${item.media_type}) with URL: ${item.presigned_url}`);

    const handleMediaPress = () => {
      console.log(`Media item pressed: ${item.id}`, item);
      // TODO: Implement action like opening in a modal/viewer
      Alert.alert('Media Pressed', `ID: ${item.id}\nType: ${item.media_type}`);
    };

    return (
      <View key={item.id} style={styles.mediaItemContainer}>
         <TouchableOpacity onPress={handleMediaPress} style={styles.mediaContent}>
          {item.media_type === 'IMAGE' ? (
            <Image
              source={{ uri: item.presigned_url }}
              style={styles.mediaImage}
              resizeMode="cover"
              onError={(e) => console.error(`Image load error for ${item.id}:`, e.nativeEvent.error)} // Add onError handler
            />
          ) : (
            // Placeholder for video - consider react-native-video for actual playback
            <View style={styles.mediaPlaceholder}>
            {/* Use onSurface color which is generally safe for icons on backgrounds */}
              <IconButton icon="video" size={40} iconColor={theme.colors.onSurface} />
              <Text numberOfLines={1} style={styles.mediaFilename}>{item.original_filename}</Text>
            </View>
          )}
          {item.caption ? <Text style={styles.mediaCaption}>{item.caption}</Text> : null}
        </TouchableOpacity>
        <IconButton
          icon="delete"
        size={20}
        iconColor={theme.colors.error}
        onPress={() => handleDeleteMedia(item.id)}
        disabled={isDeletingMedia} // Optionally disable while any delete is in progress
        style={styles.deleteButton}
      />
    </View>
    );
  };


  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollViewContainer}>
      {/* Event Details Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>{event.title}</Title>
          <Paragraph>Date: {new Date(event.start_time).toLocaleDateString()}</Paragraph>
          <Paragraph>
            Time: {new Date(event.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {new Date(event.end_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Paragraph>
          {event.location && (
            <TouchableOpacity onPress={handleOpenMap}>
              <Paragraph style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}>
                Location: {event.location}
              </Paragraph>
            </TouchableOpacity>
          )}
          {event.description && <Paragraph style={styles.description}>{event.description}</Paragraph>}
        </Card.Content>
      </Card>

      {/* Associated Members Card */}
      {event.calendar?.associated_users && event.calendar.associated_users.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Subheading>
                Associated Members ({event.calendar?.name || 'Calendar'})
            </Subheading>
            <View style={styles.participantsContainer}>
              {event.calendar?.associated_users?.map((user: AssociatedUser) => {
                console.log(`User ${user.id} (${user.username}) Avatar URL:`, user.avatar_url);
                return (
                  <Chip
                    key={user.id}
                    icon={() => (
                    user.avatar_url ? (
                      <Avatar.Image size={24} source={{ uri: user.avatar_url }} />
                    ) : (
                      <Avatar.Text size={24} label={getUserInitials(user)} />
                    )
                  )}
                  style={styles.chip}
                >
                    {getUserName(user)}
                  </Chip>
                );
              })}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Media Section Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Subheading>Media</Subheading>
          {isMediaLoading && <ActivityIndicator animating={true} style={styles.centered} />}
          {!isMediaLoading && mediaError && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              Error loading media: {mediaError}
            </Text>
          )}
          {!isMediaLoading && !mediaError && mediaItems.length === 0 && (
            <Text>No media added yet.</Text>
          )}
          {!isMediaLoading && !mediaError && mediaItems.length > 0 && (
            <View style={styles.mediaListContainer}>
              {mediaItems.map(renderMediaItem)}
            </View>
          )}
          <Button
            mode="contained"
            onPress={handleAddMedia}
            style={styles.addMediaButton}
            icon="plus"
            loading={isUploading}
            disabled={isUploading}
          >
            Add Photo/Video
          </Button>
        </Card.Content>
      </Card>

      {/* Nearby Restaurants Section Card */}
      <Card style={styles.card}>
        <TouchableOpacity onPress={handleToggleExpand} style={styles.collapsibleHeader}>
          <Subheading style={styles.collapsibleHeaderText}>Nearby Restaurants</Subheading>
          <Icon name={isExpanded ? "chevron-up" : "chevron-down"} size={24} />
        </TouchableOpacity>
        <Collapsible collapsed={!isExpanded}>
          <View style={styles.collapsibleContent}>
            {isLoadingRestaurants && <ActivityIndicator animating={true} style={{ marginVertical: 10 }} />}
            {!isLoadingRestaurants && restaurantsError && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {restaurantsError}
              </Text>
            )}
            {!isLoadingRestaurants && !restaurantsError && restaurantsLoaded && (
              restaurants.length > 0 ? (
                <FlatList
                  data={restaurants}
                  renderItem={({ item }) => <RestaurantItem item={item} />}
                  keyExtractor={(item) => item.id.toString()} // Ensure key is string
                  style={styles.restaurantListContainer}
                  scrollEnabled={false} // Disable FlatList scrolling within ScrollView
                />
              ) : (
                <Text>No nearby restaurants found.</Text>
              )
            )}
          </View>
        </Collapsible>
      </Card>

    </ScrollView>

    {/* Snackbars for Errors */}
     <Snackbar
        visible={mediaErrorVisible}
        onDismiss={() => { setMediaErrorVisible(false); dispatch(clearMediaError()); }}
        action={{ label: 'Dismiss', onPress: () => { setMediaErrorVisible(false); dispatch(clearMediaError()); } }}
        duration={Snackbar.DURATION_MEDIUM}
      >
        {mediaError || 'Error loading media.'}
      </Snackbar>
      <Snackbar
        visible={uploadErrorVisible}
        onDismiss={() => { setUploadErrorVisible(false); dispatch(clearUploadError()); }}
        action={{ label: 'Dismiss', onPress: () => { setUploadErrorVisible(false); dispatch(clearUploadError()); } }}
        duration={Snackbar.DURATION_MEDIUM}
      >
        {uploadError || 'Error uploading media.'}
      </Snackbar>
      <Snackbar
        visible={deleteErrorVisible}
        onDismiss={() => { setDeleteErrorVisible(false); dispatch(clearDeleteMediaError()); }}
        action={{ label: 'Dismiss', onPress: () => { setDeleteErrorVisible(false); dispatch(clearDeleteMediaError()); } }}
        duration={Snackbar.DURATION_MEDIUM}
      >
        {deleteMediaError || 'Error deleting media.'}
      </Snackbar>
      <Snackbar
        visible={restaurantErrorVisible}
        onDismiss={() => { setRestaurantErrorVisible(false); setRestaurantsError(null); }} // Clear local error state too
        action={{ label: 'Dismiss', onPress: () => { setRestaurantErrorVisible(false); setRestaurantsError(null); } }}
        duration={Snackbar.DURATION_MEDIUM}
      >
        {restaurantsError || 'Error fetching restaurants.'}
      </Snackbar>
    </>
  );
};

// Export the component as default
export default EventDetailScreen;
