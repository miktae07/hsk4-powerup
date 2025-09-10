import {
  View, ScrollView, Text, Image, StyleSheet,
  Pressable, Modal, Dimensions, Platform, Alert
} from 'react-native'
import { useEffect, useState } from 'react'
import hskData from '@assets/meta/hsk4.json';
import { useStore, useBearsStore } from '@/hooks/useStore';
import { Audio } from 'expo-av';
import TestTap from '@components/ui/TestTap.js';
import imgsrc from '@assets/images/finish.png';
import congrat from '@assets/images/congrat.png';

const screenDimensions = Dimensions.get('screen');

const Test = () => {
  const [showModal, setShowModal] = useState(false);
  const wArray = useStore(state => state.wArray);
  const t = useStore(state => state.t);
  const tScore = useBearsStore(state => state.tScore);
  const qAnswered = useBearsStore(state => state.qAnswered);
  const qCorrect = useBearsStore(state => state.qCorrect);
  const removeQAnswered = useBearsStore(state => state.removeQAnswered);
  const removeQCorrect = useBearsStore(state => state.removeQCorrect);
  const setIsFinish = useBearsStore(state => state.setIsFinish);

  const [soundObj, setSoundObj] = useState(null);

  // Play sound and cleanup properly
  async function playSound(m_type) {
    try {
      // unload previous if any
      if (soundObj) {
        try { await soundObj.unloadAsync(); } catch (e) { /* ignore */ }
        setSoundObj(null);
      }

      const asset = m_type === 1
        ? require('@assets/audio/level_complete.mp3')
        : require('@assets/audio/level_incomplete.mp3');

      const { sound } = await Audio.Sound.createAsync(asset);
      setSoundObj(sound);
      await sound.playAsync();

      // auto unload when finished
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          try {
            await sound.unloadAsync();
          } catch (e) { /* ignore */ }
          setSoundObj(null);
        }
      });
    } catch (err) {
      console.log('playSound error:', err);
    }
  }

  const FinishTest = () => {
    // clearer check: require all 20 answered
    if (qAnswered < 20) {
      const msg = 'You need to complete all of the questions';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert(msg);
      }
      return;
    }

    // play success or fail sound
    if (qCorrect / 20 >= 0.8) {
      playSound(1);
    } else {
      playSound(0);
    }

    setShowModal(true);
    setIsFinish(true);
  }

  useEffect(() => {
    removeQAnswered();
    removeQCorrect();
    setIsFinish(false);

    // cleanup sound on unmount
    return () => {
      if (soundObj) {
        soundObj.unloadAsync().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView stickyHeaderIndices={[0]}>
      <View style={styles.heading}>
        <Text style={styles.score}>
          Score:  <Text style={styles.score}>{tScore}</Text>
        </Text>
        <Modal visible={showModal} style={styles.modal}
          animationType="fade" transparent={true}>
          <View style={styles.modalView}>
            <View style={styles.modalContainer}>
              <View style={styles.modalLeft}>
                <Text style={styles.modalText}>
                  {
                    qCorrect / 20 < 0.8 ? (
                      <Text> Failed! </Text>
                    ) : (
                      <View>
                        <Text> Congratulate!
                          You have passed the test!</Text>
                        <Image source={congrat} style={styles.congrat} />
                        <Image source={congrat} style={styles.congrat} />
                        <Image source={congrat} style={styles.congrat} />
                      </View>
                    )
                  }
                </Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.modalRight}>
                <Text style={styles.modalText}>
                  Your score: <Text>{qCorrect} / 20 questions</Text>
                </Text>
              </View>
            </View>
            <View style={styles.imageContainer}>
              {qCorrect / 20 >= 0.8 ? <Image source={imgsrc} style={styles.image} /> : null}
            </View>
            <View style={styles.modalBtnContainer}>
              <Pressable style={styles.btnOpen} onPress={() => { setShowModal(!showModal) }}>
                <Text style={styles.text}>OK</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>

      {
        wArray.map((w, i) => {
          // only render items for the current page t (same logic you had)
          if (!((i + 1 <= 20 * t) && (i + 1 >= 20 * (t - 1) + 1))) {
            return null;
          }

          // safe access: support both hskData[index] and hskData.words[index]
          const wordEntry = (hskData && hskData[w]) ? hskData[w]
            : (hskData && hskData.words && hskData.words[w]) ? hskData.words[w]
            : null;

          if (!wordEntry || !wordEntry['translation-data']) {
            // skip rendering this item if data missing (prevents crash)
            console.warn(`Missing word data for index/key: ${String(w)} (map idx ${i})`);
            return null;
          }

          const td = wordEntry['translation-data'];

          return (
            <TestTap
              key={i}
              index={i + 1}
              testTitle={td.english}
              pinyin={td.pinyin}
              sound={td['pinyin-numbered']}
              correctAnswer={td.simplified}
            />
          );
        })
      }

      <View style={styles.buttonContainer}>
        <Pressable style={styles.button} onPress={() => { FinishTest() }}>
          <Text style={styles.text}>Submit</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  score: {
    marginLeft: 18,
    color: 'red',
    fontSize: 21,
    fontWeight: 600,
  },
  buttonContainer: {
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: 'blue',
  },
  text: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 600
  },
  modalView: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    height: screenDimensions.height / 1.75,
    margin: 70,
    padding: 25,
    borderColor: '#fafafa',
    borderWidth: 1,
    borderRadius: 10,
  },
  modalContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  modalText: {
    fontSize: 21,
  },
  modalBtnContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  separator: {
    borderBottomColor: '#bbb',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  btnOpen: {
    backgroundColor: 'blue',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 5,
  },
  imageContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10
  },
  congrat: {
    width: 48,
    height: 48,
  },
  image: {
    width: 300,
    height: 180,
    borderColor: 'red',
    borderWidth: 1,
    borderRadius: 1,
  }
})

export default Test