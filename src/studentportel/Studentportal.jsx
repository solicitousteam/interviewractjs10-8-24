import language from "./Language";
import "./student.css";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faBars,
  faMicrophoneSlash,
  faRightFromBracket,
  faXmark,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import React, { useState, useEffect, useRef } from "react";

const Studentportal = () => {
  const [searchInput, setSearchInput] = useState("");
  const [activeButton, setActiveButton] = useState("");
  const [levelType, setLevelType] = useState("");
  const [answer, setAnswer] = useState("");
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState([]);
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(false);
  const [speakQuestion, setSpeakQuestion] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isTextCleared, setIsTextCleared] = useState(false);
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();
  const audioRef = useRef(null);
  const textAreaRef = useRef(null);
  const [skippedCount, setSkippedCount] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);

  const toggleMicrophone = () => {
    if (!isMicrophoneOn) {
      if (isTextCleared) {
        resetTranscript();
        setIsTextCleared(false);
      }
      SpeechRecognition.startListening({ continuous: true, language: "en-In" });
      setTimeout(() => {
        SpeechRecognition.stopListening();
        setIsMicrophoneOn(false);
      }, 300000);
    } else {
      SpeechRecognition.stopListening();
    }
    setIsMicrophoneOn(!isMicrophoneOn);
  };

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
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
      setAnswer(""); // Clear the answer when transcript is empty and text is manually cleared and microphone is off
    }

    // Scroll to the end of textarea when answer changes
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }
  }, [transcript, isMicrophoneOn, isTextCleared, answer]);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleButtonClick = (langValue) => {
    setActiveButton(langValue);
    setLevelType("");
    setQuestionsAndAnswers([]);
    setIsMenuVisible(false);
  };

  const handleLevelTypeChange = (e) => {
    setLevelType(e.target.value);
    setQuestionsAndAnswers([]);
  };

  const handleAnswerChange = (e) => {
    setAnswer(e.target.value);
    setIsTextCleared(e.target.value === "");
  };
  const handleGetQuestion = async () => {
    if (activeButton && levelType) {
      try {
        const response = await fetch("https://compareduck.com/question", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sub_category: activeButton,
            level_type: levelType,
          }),
        });
        const data = await response.json();
        setQuestionsAndAnswers((prev) => {
          const newQaList = [
            ...prev,
            {
              question: data,
              answer: "",
              similarityScore: null,
              revealed: false,
            },
          ];
          // Limit the number of questions to 20
          return newQaList.slice(-20);
        });
        setAnswer("");
        setSpeakQuestion(true);
        setCurrentQuestionIndex(questionsAndAnswers.length);
      } catch (error) {
        console.error("Error fetching question:", error);
      }
    } else {
      alert("Please select a language and level type.");
    }
  };

  const checkAnswer = async () => {
    const currentQuestion = questionsAndAnswers[questionsAndAnswers.length - 1];
    if (!currentQuestion) return;
    try {
      const response = await fetch("https://compareduck.com/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_answer: answer,
          correct_answer: currentQuestion.question.correct_answer,
        }),
      });
      const data = await response.json();
      setQuestionsAndAnswers((prev) =>
        prev.map((qa, index) =>
          index === prev.length - 1
            ? { ...qa, answer, similarityScore: data.similarity_score }
            : qa
        )
      );
      resetTranscript();
      setAnswer("");
      setSpeakQuestion(false);

      setIsMicrophoneOn(false);
    } catch (error) {
      console.error("Error checking answer:", error);
    }
  };

  const handleDelete = () => {
    setAnswer("");
    setActiveButton("");
    setLevelType("");
    setQuestionsAndAnswers([]);
    SpeechRecognition.stopListening();
    setIsMicrophoneOn(false);
    resetTranscript();
  };

  useEffect(() => {
    if (speakQuestion && questionsAndAnswers.length > 0) {
      const currentQuestion =
        questionsAndAnswers[questionsAndAnswers.length - 1];
      // Check if the question is revealed or skipped
      if (!currentQuestion.revealed && !currentQuestion.skipped) {
        const speech = new SpeechSynthesisUtterance(
          currentQuestion.question.question
        );
        window.speechSynthesis.speak(speech);
      }
    }
  }, [speakQuestion, questionsAndAnswers]);

  const handleCloseSlider = () => {
    setIsMenuVisible(false);
  };

  const filteredLanguages = language.filter((lang) =>
    lang.label.toLowerCase().includes(searchInput.toLowerCase())
  );

  const handleSkipQuestion = (index) => {
    if (skippedCount < 5) {
      setQuestionsAndAnswers((prev) => {
        const updatedQaList = [...prev];
        updatedQaList[index].skipped = true;
        return updatedQaList;
      });
      setSpeakQuestion(false);
      setSkippedCount((prevCount) => prevCount + 1);
      // setTimeout(handleGetQuestion, 5000);
      handleGetQuestion();
      // Fetch the next question after marking the current one as skipped
    }
  };

  const handleShowAnswer = (index) => {
    setQuestionsAndAnswers((prev) => {
      const newQaList = [...prev];
      newQaList[index].showCorrectAnswer = true;
      return newQaList;
    });
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
        newQaList[index].answer = "";
        newQaList[index].similarityScore = null;
        newQaList[index].showCorrectAnswer = false;
        return newQaList;
      });
      setAnswer("");
      setIsTextCleared(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (answer === "") {
        window.location.reload();
      }
    }, 300000);
    //60000, 1min

    return () => clearInterval(interval);
  }, [answer]);

  return (
    <div className="main">
      <div className="container">
        <div className={`sliding-menu ${isMenuVisible ? "visible" : ""}`}>
          <div className="form-group">
            <div className="search-input">
              <input
                type="search"
                placeholder="Search here"
                value={searchInput}
                onChange={handleSearchChange}
              />
              <div className="wrong-icon" onClick={handleCloseSlider}>
                <FontAwesomeIcon icon={faXmark} />
              </div>
            </div>
            <div className="option-groups">
              {filteredLanguages.map((lang) => (
                <button
                  key={lang.value}
                  className={`buttons-map ${
                    activeButton === lang.value ? "active" : ""
                  }`}
                  onClick={() => handleButtonClick(lang.value)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="containers-rights">
          <div className="rightside-icons">
            <div className="rightside-icons-bar" onClick={toggleMenu}>
              <FontAwesomeIcon icon={faBars} />
            </div>
            <div className="rightside-icons-exit" onClick={handleDelete}>
              <FontAwesomeIcon icon={faRightFromBracket} />
            </div>
          </div>
          <div className="text-araea">
            {questionsAndAnswers.map((qa, index) => (
              <div key={index} className="question-display">
                <div>
                  <h4 id="question">
                    <>
                      <span>
                        {index + 1}.{qa.question.question}
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
                <div className="questio-ans-con">
                  {qa.answer && (
                    <div id="question-answer">
                      <p>
                        Your Answer:
                        {qa.answer}
                      </p>
                      <p>
                        Similarity Score:{" "}
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
                          {qa.similarityScore}/10{" "}
                        </span>
                      </p>
                      <p>
                        {qa.showCorrectAnswer ? (
                          <p>Correct Answer: {qa.question.correct_answer}</p>
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
          <div className="header-leveltype">
            <div className="header-leveltype-label">
              <label>
                <input
                  type="radio"
                  name="levelType"
                  value="Basic"
                  checked={levelType === "Basic"}
                  onChange={handleLevelTypeChange}
                />
                Basic
              </label>
              <label>
                <input
                  type="radio"
                  name="levelType"
                  value="Intermediate"
                  checked={levelType === "Intermediate"}
                  onChange={handleLevelTypeChange}
                />
                Intermediate
              </label>
              <label>
                <input
                  type="radio"
                  name="levelType"
                  value="Expert"
                  checked={levelType === "Expert"}
                  onChange={handleLevelTypeChange}
                />
                Expert
              </label>
            </div>
            <button id="submit" onClick={handleGetQuestion}>
              Get Question
            </button>
          </div>
          <div className="subt-container">
            <div className="subt-container-display">
              <div className="subt-mic-icons" onClick={toggleMicrophone}>
                <FontAwesomeIcon
                  icon={isMicrophoneOn ? faMicrophone : faMicrophoneSlash}
                />
              </div>
              {isMicrophoneOn && <div className="mic-listing">Listing...</div>}
              <div>
                <textarea
                  ref={textAreaRef}
                  value={answer}
                  readOnly={true}
                  onChange={handleAnswerChange}
                  placeholder="Enter your answer"
                  id="text-area-voice-data"
                />
              </div>
              <div>
                <button onClick={checkAnswer} id="submit">
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Studentportal;
