import axios from "axios";
import Imag4 from "../assets/Imag4.jpg";
import "./Coustem.css";
import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudUploadAlt,
  faMicrophone,
  faMicrophoneSlash,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

function Coustem() {
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(false);
  const [answer, setAnswer] = useState("");
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState("");
  const [text, setText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [partialMatches, setPartialMatches] = useState([]);
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState([]);
  const [question, setQuestion] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [selectBtn, setSelectBtn] = useState(true);
  const [isTextCleared, setIsTextCleared] = useState(false);
  const [skippedCount, setSkippedCount] = useState(0); // Track number of skipped questions
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  const textAreaRef = useRef(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);

  const handleShowAnswer = (index) => {
    setQuestionsAndAnswers((prev) => {
      const newQaList = [...prev];
      newQaList[index].showCorrectAnswer = true;
      return newQaList;
    });
  };

  const handleAnswerChange = (e) => {
    setAnswer(e.target.value);
    setIsTextCleared(e.target.value === "");
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setUploadedFiles([...uploadedFiles, selectedFile]);
  };

  const handleLevelChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setLevel(value);
    }
  };

  const handleFileUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("level_of_experience", level);

    try {
      const response = await axios.post(
        "https://compareduck.com/custom_interview",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setText(response.data.text);
      setPartialMatches(response.data.partial_matches || []);
      setQuestion(response.data.question);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const StartInterview = async () => {
    try {
      const response = await axios.get("https://compareduck.com/next_question");
      const { question, correct_answer, audio } = response.data;

      setQuestion(question);
      setCorrectAnswer(correct_answer);

      setQuestionsAndAnswers((prev) => [
        ...prev,
        {
          question: question,
          correctAnswer: correct_answer,
          audio: audio,
          revealed: false,
        },
      ]);
      setSelectBtn(false);
      setCurrentQuestionIndex((prev) => (prev === null ? 0 : prev + 1));
    } catch (error) {
      console.error("Error starting interview:", error);
    }
  };

  const handleLabelClick = () => {
    inputRef.current.click();
  };

  const speakQuestion = (questionText) => {
    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel();
    }

    const utterThis = new SpeechSynthesisUtterance(questionText);
    utterThis.onend = () => {
      console.log("SpeechSynthesisUtterance.onend");
    };

    utterThis.onerror = (event) => {
      console.error("SpeechSynthesisUtterance.onerror", event);
    };

    synth.speak(utterThis);
  };

  const getNextQuestion = async () => {
    if (questionsAndAnswers.length < 20) {
      try {
        const response = await axios.get("https://compareduck.com/next_question");
        const { question, correct_answer, audio } = response.data;
        setQuestion(question);
        setCorrectAnswer(correct_answer);

        setQuestionsAndAnswers((prev) => [
          ...prev,
          {
            question: question,
            correctAnswer: correct_answer,
            audio: audio,
            revealed: false,
          },
        ]);
        speakQuestion(question);
        setCurrentQuestionIndex(questionsAndAnswers.length);
      } catch (error) {
        console.error("Error fetching next question:", error);
      }
    }
  };

  const checkAnswer = async () => {
    try {
      const response = await axios.post("https://compareduck.com/custom_answer", {
        user_answer: answer,
        correct_answer: correctAnswer,
      });
      const { similarity_score } = response.data;

      setQuestionsAndAnswers((prev) => {
        const newQaList = [...prev];
        newQaList[newQaList.length - 1] = {
          ...newQaList[newQaList.length - 1],
          userAnswer: answer,
          similarityScore: similarity_score,
        };
        return newQaList;
      });

      resetTranscript("");
      setAnswer("");

      setIsMicrophoneOn(false);
    } catch (error) {
      console.error("Error sending request:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (answer === "") {
        window.location.reload();
      }
    }, 300000);

    return () => clearInterval(interval);
  }, [answer]);

  const toggleMicrophone = () => {
    if (!isMicrophoneOn) {
      if (isTextCleared) {
        resetTranscript(); // Reset transcript only if text is manually cleared
        setIsTextCleared(false); // Reset the flag
      }

      SpeechRecognition.startListening({ continuous: true, language: "en-In" });
      setTimeout(() => {
        SpeechRecognition.stopListening();
        setIsMicrophoneOn(false);
      }, 300000); // Stop listening after 5 minutes
    } else {
      SpeechRecognition.stopListening();
    }
    setIsMicrophoneOn(!isMicrophoneOn);
  };

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      alert(
        "Your browser doesn't support speech recognition. Please use a different browser."
      );
    }
  }, [browserSupportsSpeechRecognition]);

  useEffect(() => {
    if (transcript && isMicrophoneOn && !isTextCleared) {
      setAnswer(transcript);
    } else if (!transcript && isTextCleared && isMicrophoneOn) {
      setAnswer(true); // Clear the answer when transcript is empty and text is manually cleared and microphone is off
    }

    // Scroll to the end of textarea when answer changes
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }
  }, [transcript, isMicrophoneOn, isTextCleared, answer]);

  useEffect(() => {
    if (question && !selectBtn) {
      speakQuestion(question);
    }
  }, [question, selectBtn]);

  const handleSkipQuestion = (index) => {
    if (skippedCount < 5) {
      setQuestionsAndAnswers((prev) => {
        const updatedQaList = [...prev];
        updatedQaList[index].skipped = true;
        return updatedQaList;
      });

      setSkippedCount((prevCount) => prevCount + 1); // Fetch the next question after marking the current one as skipped
      getNextQuestion();
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      const storedWidth = sessionStorage.getItem("storedWidth");

      // Check if the width has changed significantly (more than 100 pixels)
      if (
        Math.abs(screenWidth - parseInt(storedWidth)) > 100 ||
        (!storedWidth && screenWidth > 1000) // Initial full screen or significant size
      ) {
        sessionStorage.setItem("storedWidth", screenWidth);
        window.location.reload(); // Reload the page when width changes significantly
      }
    };

    // Add event listener for resize
    window.addEventListener("resize", handleResize);

    // Store initial width when component mounts
    const screenWidth = window.innerWidth;
    sessionStorage.setItem("storedWidth", screenWidth);

    // Remove event listener when component unmounts
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        window.location.reload(); // Refresh the page if the tab becomes hidden
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleReEnterAnswer = (index) => {
    if (index === currentQuestionIndex) {
      setQuestionsAndAnswers((prev) => {
        const newQaList = [...prev];
        newQaList[index].userAnswer = "";
        newQaList[index].similarityScore = null;
        newQaList[index].correctAnswer = false;
        return newQaList;
      });
      setAnswer("");
      setIsTextCleared(false);
    }
  };

  return (
    <>
      {selectBtn ? (
        <div>
          <div className="cust-main">
            <div className="cust-img">
              <img src={Imag4} alt="Job Description" />
            </div>

            <div className="cust-coint">
              <div className="textarea">
                <textarea
                  name="text"
                  id=""
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste the job description here"
                ></textarea>
              </div>
              <div className="key-buttons">
                {partialMatches.map((match, index) => (
                  <button key={index} className="btn-key  active-btn">
                    {match}
                  </button>
                ))}
              </div>
              <div className="level-input">
                <div className="">
                  <label htmlFor="name">Enter the Experience:</label>
                  <input
                    type="number"
                    value={level}
                    onChange={handleLevelChange}
                    placeholder=""
                  />
                </div>
                <div className="file-list">
                  {uploadedFiles.length > 0 &&
                    uploadedFiles.map((file, index) => (
                      <p className="file-name" key={index}>
                        {file.name}
                      </p>
                    ))}
                </div>
              </div>
              <div className="up-btn">
                <div className="inp-up">
                  <input
                    type="file"
                    hidden
                    ref={inputRef}
                    onChange={handleFileChange}
                  />
                  <label className="upload-label" onClick={handleLabelClick}>
                    <p> FILE UPLOAD</p>
                    <FontAwesomeIcon icon={faCloudUploadAlt} className="" />
                  </label>
                </div>
                <div className="up-sub">
                  <button onClick={handleFileUpload}>Submit</button>
                </div>
              </div>
            </div>
          </div>
          <div className="cust-btn">
            <button onClick={StartInterview}>Start Interview</button>
          </div>
        </div>
      ) : (
        <>
          <div className="cust-int-main">
            <div className="con-que-an">
              <div className="que-ans">
                <div className="question-answer-list">
                  {questionsAndAnswers.slice(0, 20).map((qa, index) => (
                    <div key={index}>
                      <div className="question-re">
                        <h4 id="que">
                          <>
                            <span>
                              {index + 1}.{qa.question}
                            </span>
                            <audio hidden ref={audioRef} controls></audio>
                            {!qa.skipped && skippedCount < 5 && (
                              <button
                                id="show-que-btn"
                                onClick={() => handleSkipQuestion(index)}
                              >
                                Skip
                              </button>
                            )}
                          </>
                        </h4>
                      </div>
                      <div>
                        {qa.userAnswer && (
                          <div id="question-ans">
                            <p>
                              Your Answer:
                              {qa.userAnswer}
                            </p>
                            <p>
                              Similarity Score:
                              <span
                                style={{
                                  color:
                                    qa.similarityScore < 5
                                      ? "red"
                                      : qa.similarityScore > 5
                                      ? "green"
                                      : "inherit",
                                }}
                              >
                                {qa.similarityScore}/10
                              </span>
                            </p>
                            <p>
                              {qa.showCorrectAnswer ? (
                                <p>Correct Answer: {qa.correctAnswer}</p>
                              ) : (
                                <button
                                  id="show-que-btn"
                                  onClick={() => handleShowAnswer(index)}
                                >
                                  Show Correct Answer
                                </button>
                              )}
                            </p>
                            <button
                              id="show-que-btn"
                              onClick={() => handleReEnterAnswer(index)}
                            >
                              Re-enter answer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="cust-container">
              <div className="cust-container-display">
                <div className="cust-mic-icons" onClick={toggleMicrophone}>
                  <FontAwesomeIcon
                    icon={isMicrophoneOn ? faMicrophone : faMicrophoneSlash}
                  />
                </div>
                {isMicrophoneOn && (
                  <div className="mic-listing">Listing...</div>
                )}
                <div>
                  <textarea
                    ref={textAreaRef}
                    value={answer}
                    readOnly={true}
                    // Make the text area non-editable
                    placeholder="Voice Input will appear here"
                    id="text-area-cust-data"
                    onChange={handleAnswerChange}
                  />
                </div>
                <div className="btn-sub">
                  <button onClick={getNextQuestion} id="submit-cust">
                    get Question
                  </button>
                  <button onClick={checkAnswer} id="submit-cust">
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Coustem;
