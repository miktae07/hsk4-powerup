import React, { useEffect, useState } from 'react';
import { Dimensions, SafeAreaView, StyleSheet } from 'react-native';
import { toggleDarkMode, useRefresh, useStore } from './store';
// const hskData = require("../../assets/meta/hsk.json");

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
  console.log('HomeScreen rendered');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [randomNumbers, setRandomNumbers] = useState<number[]>([]);
  const [showReminder, setShowReminder] = useState<boolean>(false);
  const [wordCounts, setWordCounts] = useState<WordCounts>({});

  const n = useStore(state => state.n);
  const removeN = useStore(state => state.removeN);
  const refresh = useRefresh(state => state.refresh);
  const updateT = useStore(state => state.updateT);
  const addWords = useStore(state => state.pushToArray);
  const clearQ = useStore(state => state.clearQ);
  const killScore = useStore(state => state.killScore);
  const isDarkMode = toggleDarkMode(state => state.isDarkMode);

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
    for (let i = 0; i <= 3; i++) {
      let n = Math.floor(Math.random() * 601);
      numbers.push(n);
    }
    let n = Math.floor(Math.random() * 601) + 600;
    numbers.push(n);
    console.log('Generated random numbers:', numbers);
    setRandomNumbers(numbers);
  };

  const handlePress = () => {
    console.log('handlePress: navigating to Questions with randomNumbers', randomNumbers);
    navigation.navigate('Questions', { randomNumbers });
  };

  const backgroundColor = isDarkMode ? '#121212' : '#f0f2f5';
  const color = isDarkMode ? '#fff' : '#000';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      
      {/* {isLoading ? (
        <Loading />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <Modal
            visible={showReminder}
            animationType="fade"
            transparent={true}
          >
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Do you want to test your HSK words now?</Text>
              <View style={styles.modalBtnContainer}>
                <Pressable
                  style={styles.btnOpen}
                  onPress={() => {
                    setShowReminder(!showReminder);
                    navigation.navigate('Test');
                  }}
                >
                  <Text style={styles.text}>OK</Text>
                </Pressable>
                <Pressable
                  style={styles.btnClose}
                  onPress={() => setShowReminder(!showReminder)}
                >
                  <Text style={styles.text}>Close</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
          <View style={styles.content}>
            {randomNumbers.map((number, index) => (
              <Tap
                key={index}
                simplified={hskData.words[number]['translation-data'].simplified}
                tradional={hskData.words[number]['translation-data'].traditional}
                pinyin={hskData.words[number]['translation-data'].pinyin}
                soundUrl={hskData.words[number]['translation-data']['pinyin-numbered']}
                meaning={hskData.words[number]['translation-data'].english}
                index={number}
                count={wordCounts[number]}
              />
            ))}
          </View>
          <View style={styles.buttonContainer}>
            <View style={styles.button}>
              <Button title="Questions" onPress={handlePress} />
            </View>
          </View>
          <StatusBar style="auto" />
        </ScrollView>
      )} */}
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
    // You can add more styling as needed
  },
  modalView: {
    width: screenDimensions.width / 3,
    height: screenDimensions.height / 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: screenDimensions.width / 3,
    marginVertical: screenDimensions.height / 3,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
