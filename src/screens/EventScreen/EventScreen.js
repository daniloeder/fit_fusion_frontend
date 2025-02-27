import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Dimensions, Modal, Pressable, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import GradientBackground from './../../components/GradientBackground/GradientBackground';
import ShowMedia from '../../components/ShowMedia/ShowMedia';
import SubscriptionPlansModal from '../../components/Payment/SubscriptionPlansModal';
import { ShowOnMap } from '../../components/GoogleMaps/GoogleMaps.js';
import SportsItems from '../../components/SportsItems/SportsItems.js';
import PaymentCard from '../../components/Management/PaimentCard.js';
import UsersBall from '../../components/UsersBall/UsersBall.js';
import Icons from '../../components/Icons/Icons';
import { BASE_URL } from '@env';

const width = Dimensions.get('window').width;

const EventScreen = ({ route, navigation }) => {
  const { userToken, userId, eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [participantsModalVisible, setParticipantsModalVisible] = useState(false);
  const [subscriptionPlansModalVisible, setSubscriptionPlansModalVisible] = useState(false);
  const [isVideoModalVisible, setVideoModalVisible] = useState(false);

  const [userImages, setUserImages] = useState([]);
  const [owner, setOwner] = useState(null);

  const [preview, setPreview] = useState(route.params.eventPreview);

  useFocusEffect(
    useCallback(() => {
      setJoined(false);
      setParticipants([]);
      if (route.params.eventPreview) {
        setPreview(route.params.eventPreview);
        setEvent(route.params.eventPreview);
      } else if (eventId) {
        fetchEvent();
      } else {
        setEvent(null);
        Alert.alert('Event error.');
      }
    }, [eventId])
  );
  useEffect(() => {
    setEvent(preview);
  }, [preview]);

  useEffect(() => {
    if(userImages.length > 0){
      setOwner(userImages.find(item => item.user_id === event.creator));
    }
  }, [userImages]);

  useEffect(() => {
    setPreview(route.params.eventPreview);
  }, [route.params.eventPreview]);

  useEffect(() => {
    if (preview) {
      setEvent(preview);
    } else if (eventId) {
      fetchEvent();
    } else {
      Alert.alert('Event error.');
    }
  }, [eventId]);

  const fetchUserProfileImages = async (participants) => {
    if (participants.length) {
      try {
        const response = await fetch(BASE_URL + `/api/users/get-user-profile-images/?user_ids=${participants.join()}`);
        const data = await response.json();
        setUserImages(data);
      } catch (error) {
        console.error('Error fetching user profile images:', error);
      }
    }
  };

  const fetchEvent = async () => {
    try {
      const response = await fetch(BASE_URL + `/api/events/${eventId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${userToken}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
        setJoined(data.joined);
        setParticipants(data.participants || []);
        fetchUserProfileImages([...data.participants, data.creator]);
      } else {
        Alert.alert(response.status === 404 ? 'Event not Found.' : 'Unknown error on fetching event.');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    }
  };

  const onJoinLeaveEvent = async () => {
    if (preview) {
      setJoined(!joined)
      return
    }
    setJoined(!joined);
    try {
      const response = await fetch(BASE_URL + `/api/events/${eventId}/${joined ? 'leave' : 'join'}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${userToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (response.status === 200) {
      } else if (response.status === 400) {
      } else {
        setJoined(!joined);
        console.error('Failed to join the event.');
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };

  const toggleVideoModal = () => {
    setVideoModalVisible(!isVideoModalVisible);
  };

  const ManagerSubscriptionPlansModal = () => {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={subscriptionPlansModalVisible}
        onRequestClose={() => { setSubscriptionPlansModalVisible(false); fetchEvent(); }}
      >
        <View style={styles.clientManagerModalContainer}>
          <View style={[styles.clientManagerModalContent, { padding: 3 }]}>
            <Text style={styles.clientManagerModalTitle}>Subscription Plans</Text>
            <View style={{ width: '100%', minHeight: width, backgroundColor: '#FFF' }}>
              <SubscriptionPlansModal
                userToken={userToken}
                subscriptionTexts={{ button_text: !joined ? "Join this Event" : "Update Subscription" }}
                object={{
                  get_key: 'plans_ids',
                  get_id: event.subscription_plans.map(plan => plan.id),
                  obj_key: 'event_id',
                  obj_id: event.id,
                  plans_in: event.subscription_plans,
                  extra: {
                    type: 'join_event',
                    event_id: event.id,
                  }
                }}
                patternMode='see'
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (!event || !event.coordinates) return <GradientBackground firstColor="#1A202C" secondColor="#991B1B" thirdColor="#1A202C" />;
  const [longitude, latitude] = preview ? [preview.coordinates.longitude, preview.coordinates.latitude] : event.coordinates.match(/-?\d+\.\d+/g).map(Number);

  return (
    <View key={preview ? preview.title : 'loading'} style={styles.gradientContainer}>
      <GradientBackground firstColor="#1A202C" secondColor="#991B1B" thirdColor="#1A202C" />

      {event.videos && event.videos.length ?
        <Modal
          animationType="slide"
          transparent={false}
          visible={isVideoModalVisible}
          onRequestClose={toggleVideoModal}
          style={{
            width: '100%',
            height: 200,
            backgroundColor: '#000'
          }}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', backgroundColor: '#000' }}>
            <TouchableOpacity activeOpacity={1}
              style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
            >
              <ShowMedia
                media={event.videos[0].video}
                isVideo={true}
                style={{ width: width, height: width * (9 / 16) }}
              />
            </TouchableOpacity>
          </View>
        </Modal>
        : ''
      }
      {!preview && <ManagerSubscriptionPlansModal />}

      <ScrollView style={styles.container}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        overScrollMode="never"
      >

        {event.creator == userId ?
          <Pressable
            onPress={() => navigation.navigate('Manage Event', { eventId: eventId })}
            style={styles.createEventButton}
          >
            <Icons name="Settings" size={width * 0.08} />
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: width * 0.035, marginLeft: '3%' }}>Manage Event</Text>
          </Pressable> :
          owner ? <View style={{ alignItems: 'center', justifyContent: 'center', marginLeft: 'auto', zIndex: 1, marginBottom: -10 }}>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: width * 0.03 }}>Event Owner</Text>
            <UsersBall key={event.creator} user={owner} onPress={()=>navigation.navigate('User Profile', { id: event.creator })} size={0.6} />
          </View> : ''
        }

        <View style={styles.infoBlock}>
          <Text style={styles.title}>{event.title}</Text>
        </View>

        <View style={[styles.infoBlock, { marginTop: width * 0.05 }]}>
          <Icons name="Map2" size={width * 0.07} style={[styles.infoIcons, { marginBottom: 'auto', paddingTop: width * 0.08 }]} fill={"#FFF"} />
          <Text style={[styles.location, { fontSize: width * 0.05 }]}>{event.location}</Text>
        </View>
        {event.coordinates ? <ShowOnMap coordinates={{ 'latitude': latitude, 'longitude': longitude }} /> : ''}

        <View style={[styles.infoBlock, { marginTop: width * 0.05 }]}>
          <Icons name="Date" size={width * 0.06} style={[styles.infoIcons, { marginTop: -width * 0.035 }]} fill={"#FFF"} />
          <Text style={styles.dateTime}>{event.date}</Text>
        </View>

        <View style={styles.infoBlock}>
          <Icons name="Watch" size={width * 0.045} style={[styles.infoIcons, { marginLeft: width * 0.1, marginTop: -width * 0.03 }]} fill={"#FFF"} />
          <Text style={styles.dateTime}>{event.time}</Text>
        </View>

        <View style={[styles.infoBlock, { marginTop: width * 0.05 }]}>
          <Icons name="Sport" size={width * 0.055} style={[styles.infoIcons, { marginBottom: 'auto', paddingTop: width * 0.08 }]} />
          <SportsItems favoriteSports={event.sport_types} />
        </View>

        <View style={styles.infoBlock}>
          <Icons name="Description" size={width * 0.055} style={[styles.infoIcons, { marginBottom: 'auto', paddingTop: width * 0.07 }]} />
          <Text style={styles.description}>{event.description}</Text>
        </View>

        {joined ?
          <>
            <TouchableOpacity style={[styles.button, { backgroundColor: 'red' }]} onPress={()=>{
              Alert.alert("Are you sure you want to leave this event?", "", [{ text: "Cancel", style: "cancel" }, { text: "Leave", onPress: onJoinLeaveEvent }]);
            }}>
              <Text style={styles.buttonText}>Leave Event</Text>
            </TouchableOpacity>
            <View>
              <Text style={[styles.joinText, { color: '#22AA00' }]}>
                You joined this event.
              </Text>
            </View>

            {event.subscription && (
              <PaymentCard
                subscriptionData={event.subscription}
                setSubscriptionPlansModalVisible={setSubscriptionPlansModalVisible}
              />
            )}
          </>
          :
          <>
            <TouchableOpacity style={[styles.button, { backgroundColor: 'green' }]} onPress={() => {
              if (!preview && event.creator !== userId) {
                if (event.is_private) {
                  if (event.subscription_plans.length === 0) {
                    Alert.alert('The owner still not published any subscription plan. Try again later.');
                  } else {
                    setSubscriptionPlansModalVisible(true);
                  }
                } else {
                  Alert.alert("Are you sure you want to join this event?", "", [{ text: "Cancel", style: "cancel" }, { text: "Join", onPress: onJoinLeaveEvent }]);
                }
              }
            }}>
              <Text style={styles.buttonText}>Join Event</Text>
            </TouchableOpacity>
            <View>
              <Text style={[styles.joinText, { color: '#AAA' }]}>
                You are not at this event.
              </Text>
            </View>
          </>
        }

        <Text style={styles.participantTitle}>Participants</Text>
        <Pressable style={styles.participantsImages}
          onPress={() => {
            setParticipantsModalVisible(participants.length > 0);
          }}
        >
          {(preview ? [...Array(5)] : userImages.slice(0, 10)).map((image, index) =>
            <View key={index}
              style={[styles.image, { zIndex: 5 - index }, index === 0 ? { marginLeft: 0 } : {}]}
            >
              {!preview && image.success ?
                <Image
                  source={{ uri: `data:image/jpeg;base64,${image.profile_image}` }}
                  style={{ width: '100%', height: '100%', borderRadius: 100 }}
                  onError={(error) => console.error('Image Error:', error)}
                />
                :
                <Icons name="Profile2" size={width * 0.05} />
              }
            </View>
          )}
          {event.participants_amount > 10 ? (<Text style={styles.moreText}>+{event.participants_amount - 10}</Text>) : ''}
          {preview ? (<Text style={styles.moreText}>+125</Text>) : ''}
          {participants.length > 0 ?
            //<View style={styles.seeMoreButton}><Text style={styles.seeAllText}>See All</Text></View>
            ''
            :
            !preview ? <Text style={styles.moreText}>There is still no participants.</Text> : ''
          }
        </Pressable>

        {(event.photos && event.photos.length) || (event.videos && event.videos.length) ? <Text style={styles.participantTitle}>Media</Text> : ''}
        {event.photos && event.photos.length ?
          <Text style={{ fontSize: width * 0.05, color: '#FFF', fontWeight: 'bold' }}>Images</Text>
          : ''
        }

        {event.images && event.images.length ?
          <View
            style={styles.userImagesContainer}
          >
            <View style={styles.infoBlock}>
              <Icons name="Images" size={width * 0.07} style={styles.infoIcons} />
            </View>
            {event.images.map((image, index) => {
              return (
                <View key={index}
                  style={styles.userImagesItems}
                >
                  <ShowMedia media={preview ? image.photo : BASE_URL + `${image.image}`} size={width * 0.26} />
                </View>
              )
            })}
          </View>
          : ''
        }
        {(event.videos && event.videos.length) || (preview && event.videos) ?
          <View
            style={styles.userImagesContainer}
          >
            <View style={[styles.infoBlock, { justifyContent: 'center' }]}>
              <Icons name="Images" size={width * 0.07} style={[styles.infoIcons, { position: 'absolute', left: 0, top: 0 }]} />
              <Pressable onPress={toggleVideoModal} >
                <Icons name="PlayVideo" size={width * 0.25} style={{ backgroundColor: '#DDD' }} />
              </Pressable>
            </View>
          </View>
          : ''
        }

        {(event.videos && event.videos.length) || (preview && event.videos) ?
          <Modal
            animationType="slide"
            transparent={false}
            visible={isVideoModalVisible}
            onRequestClose={toggleVideoModal}
            style={{ width: '100%', backgroundColor: '#000' }}
          >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', backgroundColor: '#000' }}>
              <TouchableOpacity activeOpacity={1}
                style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
              >
                <ShowMedia
                  media={preview ? event.videos : `${event.videos[0].video}`}
                  isVideo={true}
                  style={{ width: width, height: width * (9 / 16) }}
                />
              </TouchableOpacity>
            </View>
          </Modal>
          : ''
        }

        {preview ?
          <TouchableOpacity style={[styles.button, { backgroundColor: 'red', marginTop: width * 0.1, paddingVertical: width * 0.05 }]} onPress={() => {
            setEvent(null);
            setPreview(null);
            navigation.navigate("Create Event")
          }}>
            <Text style={styles.buttonText}>Back to edition</Text>
          </TouchableOpacity> : ''
        }
        <View style={{ marginBottom: 100 }}>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: width * 0.04,
  },
  infoBlock: {
    width: width * 0.82,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: width * 0.025,
  },
  location: {
    fontSize: width * 0.056,
    color: '#A0AEC0',
    marginBottom: width * 0.025,
  },
  dateTime: {
    fontSize: width * 0.045,
    color: '#A0AEC0',
    marginBottom: width * 0.038,
  },
  sportType: {
    fontSize: width * 0.045,
    color: '#3182CE',
    marginBottom: width * 0.05,
  },
  description: {
    fontSize: width * 0.045,
    color: '#CCCCCC',
    marginBottom: width * 0.038,
  },
  infoIcons: {
    marginRight: width * 0.025,

  },
  button: {
    opacity: 0.8,
    paddingVertical: width * 0.025,
    paddingHorizontal: width * 0.038,
    borderRadius: width * 0.0125,
    marginTop: width * 0.025,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  joinText: {
    marginTop: width * 0.01,
    marginBottom: width * 0.04,
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  buttonText: {
    color: '#FFF',
    fontSize: width * 0.04,
    textAlign: 'center',
  },
  participantTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: width * 0.025,
  },
  participant: {
    backgroundColor: '#2D3748',
    opacity: 0.8,
    padding: width * 0.025,
    marginBottom: width * 0.0125,
    borderRadius: 125,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantName: {
    fontSize: width * 0.04,
    color: '#A0AEC0',
    marginLeft: '3%',
  },
  participantsImages: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: width * 0.025,
  },
  image: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.05,
    borderWidth: 1,
    borderColor: '#777',
    backgroundColor: '#AAA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -width * 0.055,
  },
  moreText: {
    color: '#FFF',
    marginLeft: width * 0.025,
  },
  seeMoreButton: {
    padding: width * 0.02,
    borderRadius: width * 0.02,
    backgroundColor: 'rgba(100,100,100,0.2)',
    marginLeft: '3%'
  },
  seeAllText: {
    color: '#FFF',
    marginLeft: 0,
  },

  createEventButton: {
    height: width * 0.12,
    paddingHorizontal: width * 0.05,
    borderRadius: width * 0.06,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Styles for Client Requests Modal
  clientManagerModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  clientManagerModalContent: {
    width: '96%',
    maxHeight: '90%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  clientManagerModalTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  // PARTICIPANTS MODAL

  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 50, 50, 0.6)',
  },
  modalContent: {
    width: width * 0.8,
    maxHeight: width * 1.4,
    backgroundColor: 'white',
    padding: width * 0.04,
    borderRadius: width * 0.02,
  },
  participantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: width * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
  },
  iconContainer: {
    width: width * 0.1,
    height: width * 0.1,
    backgroundColor: '#EEE',
    padding: width * 0.04,
    borderRadius: width * 0.05,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DDD',
  },
  participantName: {
    fontSize: width * 0.04,
    marginLeft: '3%',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: width * 0.04,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: 'gray',
    fontSize: width * 0.04,
  },


  userImagesContainer: {
    width: '100%',
    paddingVertical: width * 0.01,
    borderRadius: width * 0.02,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: width * 0.03,
  },
  userImagesItems: {
    width: width * 0.26,
    height: width * 0.26,
    margin: width * 0.02,
    position: 'relative',
  },
});

export default EventScreen;