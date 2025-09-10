// TypingQuiz.js (updated)
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
    const updateScore = useStore(state => state.updateScore); // increments (existing)
    const decreaseScore = useStore(state => state.decreaseScore); // optional store fn to decrement
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
    const [questions, setQuestions] = useState(null);
    const [placeholder, setPlaceholder] = useState('Type your answer')
    const [text, setText] = useState('');
    const [attempts, setAttempts] = useState(0); // count wrong attempts for current question
    const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

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

        // reset per-question state
        setText('');
        setAttempts(0);
        setShowCorrectAnswer(false);
        setPlaceholder('Type your answer');
    };

    async function playSound(m_type) {
        try {
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
        increaseN && increaseN();
    }, []);

    useEffect(() => {
        if (index >= 0) {
            fetchData(index);
        }
    }, [index]);

    // helper to advance to next question (used for correct or after penalty)
    const goToNextQuestion = async (currentIdx) => {
        // keep behavior consistent with previous code: try to play success then load next
        // but we will fetch next directly using index + 1 to avoid waiting on store q update
        const nextIndex = (typeof currentIdx === 'number') ? currentIdx + 1 : index + 1;
        // increment global Q (store) so other components stay in sync
        increaseQ && increaseQ();
        // small delay to allow sound to play if needed
        setTimeout(() => {
            fetchData(nextIndex);
        }, 150); // short delay
    };

    // centralised submit handler
    const handleSubmitEditing = async () => {
        if (!questions) return;

        const typed = text ? String(text).trim() : '';
        const expected = questions.question || '';

        if (typed === expected) {
            // correct
            setText('');
            setPlaceholder('Type your answer');
            if (typeof updateScore === 'function') updateScore();
            await playSound(true);
            goToNextQuestion(index);
            return;
        }

        // incorrect
        await playSound(false);
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        // If attempts reaches threshold (>=3) -> apply penalty, show correct answer, then next Q
        const THRESHOLD = 3; // >=3 wrong attempts triggers -1 point
        if (newAttempts >= THRESHOLD) {
            // apply penalty: try store decreaseScore(), otherwise try calling updateScore(-1)
            if (typeof decreaseScore === 'function') {
                decreaseScore();
            } else if (typeof updateScore === 'function') {
                // best-effort: call updateScore with -1 (if store supports an argument)
                try {
                    updateScore(-1);
                } catch (err) {
                    console.warn('updateScore(-1) failed or not supported:', err);
                }
            }

            // show correct answer to user
            setShowCorrectAnswer(true);

            // advance to next question after short delay so user sees the correct answer
            setTimeout(() => {
                goToNextQuestion(index);
            }, 900);
            return;
        }

        // otherwise allow user to try again (focus stays)
        // Optionally update placeholder to give hint or remaining tries
        const remaining = THRESHOLD - newAttempts;
        setPlaceholder(`Incorrect — ${remaining} attempt(s) left`);
    };

    const handleTextChange = (newText) => {
        setText(newText);
    };

    const handleIconPress = () => {
        setPlaceholder(questions?.pinyin || '');
    };

    const playPinyinSound = async () => {
        try {
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
            
            if (sound) {
                try {
                    await sound.unloadAsync();
                    setSound(null);
                } catch (cleanupError) {
                    console.error('Error cleaning up previous sound:', cleanupError);
                }
            }

            const pinyinNumbered = wordData['pinyin-numbered'];
            const syllables = parsePinyinSyllables(pinyinNumbered);
            
            for (let i = 0; i < syllables.length; i++) {
                const syllable = syllables[i];
                const url = `https://cdn.yoyochinese.com/audio/pychart/${syllable.toLowerCase()}.mp3`;
                
                try {
                    const { sound: newSound } = await Audio.Sound.createAsync(
                        { uri: url },
                        { shouldPlay: true }
                    );
                    setSound(newSound);
                    
                    await new Promise((resolve, reject) => {
                        newSound.setOnPlaybackStatusUpdate(status => {
                            if (status.didJustFinish) {
                                resolve();
                            } else if (status.error) {
                                reject(new Error('Sound playback error: ' + status.error));
                            }
                        });
                    });
                    
                    await newSound.unloadAsync();
                    setSound(null);
                    
                    if (i < syllables.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                } catch (syllableError) {
                    console.error('Error playing syllable ' + syllable + ':', syllableError);
                }
            }
        } catch (error) {
            console.error('Error playing pinyin sound sequence:', error);
            if (sound) {
                try {
                    await sound.unloadAsync();
                    setSound(null);
                } catch (cleanupError) {
                    console.error('Error cleaning up sound after error:', cleanupError);
                }
            }
        }
    };

    function parsePinyinSyllables(pinyin) {
        const cleanPinyin = pinyin.trim().replace(/\s+/g, '');
        const syllables = [];
        let currentSyllable = '';
        
        for (let i = 0; i < cleanPinyin.length; i++) {
            const char = cleanPinyin[i];
            if (/[0-9]/.test(char)) {
                currentSyllable += char;
                syllables.push(currentSyllable);
                currentSyllable = '';
            } else {
                currentSyllable += char;
            }
        }
        
        return syllables;
    }

    return (
        <View>
            <Text style={(screenDimensions.width > 480) ? styles.score : styles.scorePhone}>
                SCORE: {score}</Text>
            {questions ? (
                <View style={(screenDimensions.width > 480) ? styles.questions : styles.questionsPhone}>
                    <Text style={styles.questionsTitle}>
                        <TouchableOpacity onPress={() => playPinyinSound()}>
                            <Ionicons style={styles.iconicsTitle} name="volume-high" size={48} color="black" />
                        </TouchableOpacity>
                        {questions.correctAnswer}
                    </Text>
                    <View>
                        <View style={styles.inputContainer}>
                            <TextInput
                                autoFocus={true}
                                style={styles.input}
                                placeholder={placeholder}
                                onChangeText={handleTextChange}
                                value={text}
                                onSubmitEditing={() => handleSubmitEditing()}
                            />
                            <TouchableOpacity style={styles.helpContainer} onPress={handleIconPress}>
                                <MaterialIcons name="help-outline" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.btnContainer}>
                            <Button style={styles.btn} title="Submit" onPress={() => handleSubmitEditing()} />
                        </View>

                        {showCorrectAnswer ? (
                            <View style={{ marginTop: 12 }}>
                                <Text style={{ color: 'red', fontWeight: '700' }}>
                                    Đáp án đúng: {questions.question}
                                </Text>
                            </View>
                        ) : null}

                        {/* show attempts info */}
                        <View style={{ marginTop: 8 }}>
                            <Text>Sai: {attempts} / 3</Text>
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
