import { DailyGrammarSection } from '@/components/ui/DailyGrammar';
import { toggleDarkMode, useRefresh, useStore } from '@/hooks/useStore';
import hskData from '@assets/meta/hsk4.json';
import data from '@assets/meta/hsk4_grammar.json';
import Tap from '@components/Tap';
import Loading from '@components/ui/Loading';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Button,
  Dimensions,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const screenDimensions = Dimensions.get('screen');

type HomeProps = {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
};

type WordCounts = {
  [key: number]: number;
};

export default function HomeScreen({ navigation }: HomeProps) {
  const router = useRouter();

  console.log('HomeScreen rendered');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [randomNumbers, setRandomNumbers] = useState<number[]>([]);
  const [showReminder, setShowReminder] = useState<boolean>(false);
  const [wordCounts, setWordCounts] = useState<WordCounts>({});

  const n = useStore((state: any) => state.n);
  const removeN = useStore((state: any) => state.removeN);
  const refresh = useRefresh((state: any) => state.refresh);
  const updateT = useStore((state: any) => state.updateT);
  const addWords = useStore((state: any) => state.pushToArray);
  const clearQ = useStore((state: any) => state.clearQ);
  const killScore = useStore((state: any) => state.killScore);
  const setDailyGrammar = useStore((state: any) => state.setDailyGrammar);
  const isDarkMode = toggleDarkMode((state: any) => state.isDarkMode);

  // Move lessonId computation BEFORE useEffect that depends on it
  const getDayOfYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now as any) - (start as any);
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);
    console.info('Day is ', day);
    return day;
  };

  const dayOfYear = getDayOfYear();
  const totalLessons = data.lessons.length;
  const lessonId = (dayOfYear % totalLessons) + 1;
  console.log('lessonId: ', lessonId);

  useEffect(() => {
    const lesson = data.lessons.find(l => l.lessonId === lessonId);
    if (lesson && lesson.grammarPoints.length > 0) {
      const randomIndex = Math.floor(Math.random() * lesson.grammarPoints.length);
      const grammarPoint = lesson.grammarPoints[randomIndex];
      setDailyGrammar(grammarPoint);
    }
  }, [lessonId, setDailyGrammar]);

  useEffect(() => {
    console.log('useEffect [] ran');
    console.log('useEffect []: generating random numbers');
    generateRandomNumbers();
    if (n >= 3) {
      console.log('n >= 3, updating T, showing reminder, removing N');
      updateT();
      setShowReminder(true);
      removeN();
    }
  }, []);

  useEffect(() => {
    if (randomNumbers.length > 0) {
      console.log('useEffect [randomNumbers]: randomNumbers', randomNumbers);
      addWords(randomNumbers);
      setIsLoading(false);

      const newWordCounts = { ...wordCounts };
      randomNumbers.forEach(number => {
        newWordCounts[number] = (newWordCounts[number] || 0) + 1;
      });
      setWordCounts(newWordCounts);
      console.log('Updated wordCounts:', newWordCounts);
    }
  }, [randomNumbers]);

  useEffect(() => {
    console.log('useEffect [refresh]: refresh triggered, regenerating random numbers, killing score, clearing Q');
    generateRandomNumbers();
    killScore();
    clearQ();
  }, [refresh]);

  const generateRandomNumbers = () => {
    const numbers: number[] = [];
    const max = hskData.length;
    for (let i = 0; i < 4; i++) {
      let n = Math.floor(Math.random() * max);
      numbers.push(n);
    }
    console.log('Generated random numbers:', numbers);
    setRandomNumbers(numbers);
  };

  const handlePress = () => {
    router.push({ pathname: '/quiz', params: { randomNumbers } });
  };

  const backgroundColor = isDarkMode ? '#121212' : '#f0f2f5';
  const color = isDarkMode ? '#fff' : '#000';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {isLoading ? (
        <Loading />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <Modal visible={showReminder} animationType="fade" transparent={true}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Do you want to test your HSK words now?</Text>
              <View style={styles.modalBtnContainer}>
                <Pressable
                  style={styles.btnOpen}
                  onPress={() => {
                    setShowReminder(!showReminder);
                    router.push('/test');
                  }}
                >
                  <Text style={styles.text}>OK</Text>
                </Pressable>
                <Pressable style={styles.btnClose} onPress={() => setShowReminder(false)}>
                  <Text style={styles.text}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
          <View style={styles.content}>
            {randomNumbers.map((number, index) => {
              const word = hskData[number];
              if (!word) return null; // Prevent crash if out of bounds
              return (
                <Tap
                  key={number /* use stable key rather than index */}
                  simplified={word['translation-data'].simplified}
                  traditional={word['translation-data'].traditional}
                  pinyin={word['translation-data'].pinyin}
                  soundUrl={word['translation-data']['pinyin-numbered']}
                  meaning={word['translation-data'].english}
                  index={number}
                  count={wordCounts[number]}
                />
              );
            })}
          </View>
          <DailyGrammarSection lessonId={lessonId} />
          <View style={styles.buttonContainer}>
            <View style={styles.button}>
              <Button title="Questions" onPress={handlePress} />
            </View>
          </View>
          <StatusBar />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  scrollView: {
    marginHorizontal: 0,
  },
  content: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  buttonContainer: {
    marginVertical: 30,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    marginHorizontal: 10,
  },
  modalView: {
    width: screenDimensions.width / 1.5,
    // use a larger width so content fits nicely on small screens
    minHeight: 140,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: screenDimensions.width / 12,
    marginVertical: screenDimensions.height / 4,
    padding: 20,
    alignItems: 'center',
    // React Native shadow (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    // elevation for Android
    elevation: 5,
  },
  modalText: {
    fontSize: 21,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalBtnContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
  },
  btnOpen: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: 'blue',
    marginRight: 8,
  },
  btnClose: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: 'black',
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
});
