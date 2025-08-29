import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Button, TouchableOpacity, Dimensions } from 'react-native';
import hskData from '@assets/meta/hsk4.json';
import { useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useStore } from '@/hooks/useStore';
import { TextInput } from 'react-native-gesture-handler';
const screenDimensions = Dimensions.get('screen');

const TypingQuiz = () => {
    const route = useRoute();
    const increaseN = useStore(state => state.increaseN);
    const increaseQ = useStore(state => state.increaseQ);
    const updateScore = useStore(state => state.updateScore);
    const n = useStore(state => state.n);
    const q = useStore(state => state.q);
    const score = useStore(state => state.score);
    const randomNumbers = route.params?.randomNumbers ? 
        (typeof route.params.randomNumbers === 'string' ? 
            route.params.randomNumbers.split(',').map(n => parseInt(n.trim())) : 
            route.params.randomNumbers) : [];

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [index, setIndex] = useState(0);
    const [sound, setSound] = useState();
    const [questions, setQuestions] = useState([]);
    const [placeholder, setPlaceholder] = useState('Type your answer')
    const [text, setText] = useState('');

    const fetchData = (indexNumber) => {
        if (!Array.isArray(randomNumbers) || indexNumber >= randomNumbers.length) {
            console.log('Invalid index or randomNumbers:', indexNumber, randomNumbers);
            return;
        }

        const wordIndex = randomNumbers[indexNumber];
        if (!hskData[wordIndex] || !hskData[wordIndex]['translation-data']) {
            console.log('Word data not found for index:', wordIndex);
            return;
        }

        const word = hskData[wordIndex]['translation-data'];
        setQuestions({
            question: word.simplified,
            pinyin: word.pinyin,
            correctAnswer: word.english,
        });
    };

    async function playSound(m_type) {
        try {
            // Unload previous sound if exists
            if (sound) {
                await sound.unloadAsync();
                setSound(null);
            }

            const audioFile = m_type === true ? 
                require('@assets/audio/correct.mp3') : 
                require('@assets/audio/incorrect.wav');

            const { sound: newSound } = await Audio.Sound.createAsync(
                audioFile,
                { shouldPlay: true }
            );
            setSound(newSound);

            // Add error handler for playback completion
            newSound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.didJustFinish) {
                    try {
                        await newSound.unloadAsync();
                    } catch (error) {
                        console.log('Error unloading sound:', error);
                    }
                }
            });
        } catch (error) {
            console.log('Error playing sound:', error);
            if (sound) {
                try {
                    await sound.unloadAsync();
                    setSound(null);
                } catch (cleanupError) {
                    console.log('Error cleaning up sound after error:', cleanupError);
                }
            }
        }
    }

    // Initialize audio
    useEffect(() => {
        const initAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: true,
                    staysActiveInBackground: false,
                    playThroughEarpieceAndroid: false,
                    interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
                    interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
                });
            } catch (error) {
                console.log('Error initializing audio:', error);
            }
        };
        
        initAudio();
        
        // Clean up sound when component unmounts
        return () => {
            if (sound) {
                sound.unloadAsync().catch(error => {
                    console.log('Error cleaning up sound:', error);
                });
            }
        };
    }, []);

    useEffect(() => {
        const newIndex = Math.floor(q / 2);
        if (newIndex < (randomNumbers?.length || 0)) {
            setIndex(newIndex);
        }
    }, [q, randomNumbers]);

    useEffect(() => {
        setText('');
        increaseN();
    }, []);

    useEffect(() => {
        if (index >= 0) {
            fetchData(index);
            // Let's not auto-play sound on index change
            // User needs to click the sound button instead
        }
    }, [index]);

    useEffect(() => {
        console.log(text);
        if (text == questions.question) {
            setText('')
            setPlaceholder('Type your answer')
            updateScore()
            increaseQ()
            playSound(true).then(() => {
                fetchData(index + 1)
            })
        }
    }, [text]);

    function parsePinyinSyllables(pinyin) {
        // Remove spaces and split into syllables
        const cleanPinyin = pinyin.trim().replace(/\s+/g, '');
        const syllables = [];
        let currentSyllable = '';
        
        for (let i = 0; i < cleanPinyin.length; i++) {
            const char = cleanPinyin[i];
            if (/[0-9]/.test(char)) {
                // When we hit a number, complete the current syllable
                currentSyllable += char;
                syllables.push(currentSyllable);
                currentSyllable = '';
            } else {
                currentSyllable += char;
            }
        }
        
        return syllables;
    }

    const playPinyinSound = async () => {
        try {
            // Input validation
            if (!Array.isArray(randomNumbers) || !hskData) {
                console.error('Missing data:', { randomNumbers, hskData: !!hskData });
                return;
            }
            
            const currentIndex = Math.floor(q / 2);
            if (currentIndex >= randomNumbers.length) {
                console.error('Index out of bounds:', currentIndex, randomNumbers.length);
                return;
            }
            
            const wordIndex = randomNumbers[currentIndex];
            if (!hskData[wordIndex]) {
                console.error('No word data for index:', wordIndex);
                return;
            }

            const wordData = hskData[wordIndex]['translation-data'];
            if (!wordData || !wordData['pinyin-numbered']) {
                console.error('Missing pinyin data:', wordData);
                return;
            }
            
            // Clean up any previous sound
            if (sound) {
                try {
                    await sound.unloadAsync();
                    setSound(null);
                } catch (cleanupError) {
                    console.error('Error cleaning up previous sound:', cleanupError);
                }
            }

            const pinyinNumbered = wordData['pinyin-numbered'];
            console.log('Playing pinyin:', pinyinNumbered);
            
            const syllables = parsePinyinSyllables(pinyinNumbered);
            
            // Play each syllable in sequence
            for (let i = 0; i < syllables.length; i++) {
                const syllable = syllables[i];
                const url = `https://cdn.yoyochinese.com/audio/pychart/${syllable.toLowerCase()}.mp3`;
                
                try {
                    const { sound: newSound } = await Audio.Sound.createAsync(
                        { uri: url },
                        { shouldPlay: true }
                    );
                    setSound(newSound);
                    
                    // Wait for the sound to finish
                    await new Promise((resolve, reject) => {
                        newSound.setOnPlaybackStatusUpdate(status => {
                            if (status.didJustFinish) {
                                resolve();
                            } else if (status.error) {
                                reject(new Error('Sound playback error: ' + status.error));
                            }
                        });
                    });
                    
                    // Clean up after each syllable
                    await newSound.unloadAsync();
                    setSound(null);
                    
                    // Small pause between syllables
                    if (i < syllables.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                } catch (syllableError) {
                    console.error('Error playing syllable ' + syllable + ':', syllableError);
                }
            }
        } catch (error) {
            console.error('Error playing pinyin sound sequence:', error);
            // Clean up on error
            if (sound) {
                try {
                    await sound.unloadAsync();
                    setSound(null);
                } catch (cleanupError) {
                    console.error('Error cleaning up sound after error:', cleanupError);
                }
            }
        }
    }

    const handleTextChange = (newText) => {
        setText(newText);
    };

    const handleSubmitEditing = () => {
        if (text == questions.question) {
            console.log('Correct')
            setText('')
            setPlaceholder('Type your answer')
            updateScore()
            increaseQ()
            playSound(true).then(() => {
                fetchData(index + 1)
            })
        }
        else {
            console.log('Incorrect')
            playSound(false)
        }
    }

    const handleIconPress = () => {
        setPlaceholder(questions.pinyin)
    };

    return (
        <View>
            <Text style={(screenDimensions.width > 480) ? styles.score : styles.scorePhone}>
                SCORE: {score}</Text>
            {questions ? (
                <View style={(screenDimensions.width > 480) ? styles.questions : styles.questionsPhone}>
                    <Text style={styles.questionsTitle}>
                        <TouchableOpacity
                            onPress={() =>
                                playPinyinSound()}>
                            <Ionicons style={styles.iconicsTitle}
                                name="volume-high" size={48} color="black" />
                        </TouchableOpacity>
                        {questions.correctAnswer}
                    </Text>
                    <View>
                        <View style={styles.inputContainer}>
                            <TextInput autoFocus={true} style={styles.input} placeholder={placeholder}
                                onChangeText={handleTextChange} value={text}
                                onSubmitEditing={() => handleSubmitEditing()}
                            />
                            <TouchableOpacity style={styles.helpContainer} onPress={handleIconPress}>
                                <MaterialIcons name="help-outline" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.btnContainer}>
                            <Button style={styles.btn} title="Submit" onPress={() => handleSubmitEditing()} />
                        </View>
                    </View>
                </View>
            ) : (
                <Text>Data failed to set</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    questions: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#f0f2f5',
        justifyContent: 'center',
        paddingHorizontal: 180,
    },
    questionsPhone: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#f0f2f5',
        justifyContent: 'center',
        width: screenDimensions.width,
        height: screenDimensions.height
    },
    questionsTitle: {
        display: 'flex',
        flexDirection: 'column',
        fontSize: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25
    },
    iconicsTitle: {
        marginTop: 8,
    },
    touchableHighlight: {
        backgroundColor: '#fff',
        borderWidth: 0.001,
        borderRadius: 3,
        margin: 5,
        padding: 3,
    },
    touchableHighlightPhone: {
        backgroundColor: '#fff',
        borderWidth: 0.001,
        justifyContent: 'center',
        borderRadius: 3,
        marginVertical: 5,
        marginHorizontal: 3,
        width: screenDimensions.width - 10,
    },
    answers: {
        fontSize: 25,
        alignItems: 'center',
        backgroundColor: '#ececec',
        padding: 9,
        overflow: 'hidden',
    },
    answersPhone: {
        fontSize: 25,
        alignItems: 'center',
        backgroundColor: '#ececec',
        paddingVertical: 9,
        paddingLeft: 10,
        overflow: 'hidden',
    },
    score: {
        fontSize: 25,
        margin: 5,
    },
    scorePhone: {
        fontSize: 18,
        textAlign: 'right',
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 32,
        padding: 12,
        border: '1.6px solid #000',
        borderRadius: 3
    },
    inputContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    btnContainer: {
        display: 'flex',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: '30%',
        width: '100%',
    },
});

export default TypingQuiz;