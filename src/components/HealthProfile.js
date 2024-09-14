import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HealthProfile.css';

const HealthProfile = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isNewSession, setIsNewSession] = useState(false);
  const totalPages = 3;

  useEffect(() => {
    checkSession();
    showQuestion(currentPage);
  }, [currentPage]);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/check-session');
      const data = await response.json();
      setIsNewSession(data.isNewSession);

      if (data.isNewSession) {
        // Clear any existing profile data
        localStorage.removeItem('clientInfo');
        localStorage.removeItem('healthProfile');
        
        // Show the client info form
        document.getElementById('clientInfoForm').style.display = 'block';
        document.getElementById('profileForm').style.display = 'none';
        document.getElementById('savedProfile').style.display = 'none';
        document.getElementById('visitSummary').style.display = 'none';
      } else {
        // Load existing profile if available
        const savedClientInfo = JSON.parse(localStorage.getItem('clientInfo'));
        if (savedClientInfo) {
          document.getElementById('clientInfoForm').style.display = 'none';
          document.getElementById('profileForm').style.display = 'block';
          
          document.title = `${savedClientInfo.firstName}'s Profile`;
          document.getElementById('mainHeading').textContent = `${savedClientInfo.firstName}'s Profile`;
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const showQuestion = (pageNumber) => {
    const pages = document.querySelectorAll('.page');
    pages.forEach((p, index) => {
      p.style.display = index === pageNumber ? 'block' : 'none';
    });
    document.getElementById('pageNumber').textContent = `${pageNumber + 1} / ${totalPages}`;
    
    document.getElementById('prevButton').style.display = pageNumber > 0 ? 'inline-block' : 'none';
    document.getElementById('nextButton').style.display = pageNumber < totalPages - 1 ? 'inline-block' : 'none';
    document.getElementById('saveButton').style.display = pageNumber === totalPages - 1 ? 'inline-block' : 'none';
  };

  const nextQuestion = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevQuestion = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const saveClientInfo = () => {
    const firstName = document.getElementById('firstNameInput').value;
    const lastName = document.getElementById('lastNameInput').value;
    const phone = document.getElementById('phoneInput').value;
    const address = document.getElementById('addressInput').value;

    const clientInfo = { firstName, lastName, phone, address };
    localStorage.setItem('clientInfo', JSON.stringify(clientInfo));

    document.getElementById('clientInfoForm').style.display = 'none';
    document.getElementById('profileForm').style.display = 'block';

    document.title = `${firstName}'s Profile`;
    document.getElementById('mainHeading').textContent = `${firstName}'s Profile`;
  };

  const saveProfile = () => {
    const profile = {
      age: document.getElementById('ageInput').value,
      weight: document.getElementById('weightInput').value,
      bloodType: document.getElementById('bloodTypeInput').value,
      height: document.getElementById('heightInput').value,
      gender: document.getElementById('genderInput').value,
      children: document.getElementById('childrenInput').value,
      allergies: document.getElementById('allergiesInput').value,
      chronicConditions: document.getElementById('chronicConditionsInput').value,
      tobacco: document.getElementById('tobaccoInput').value,
      alcohol: document.getElementById('alcoholInput').value,
      surgeries: Array.from(document.querySelectorAll('input[name="surgeries"]:checked')).map(el => el.value).join(', '),
      familyHistory: Array.from(document.querySelectorAll('input[name="familyHistory"]:checked')).map(el => el.value).join(', '),
      recentChanges: document.getElementById('recentChangesInput').value,
      infectiousAreas: document.getElementById('infectiousAreas').value,
      sexualActivity: document.getElementById('sexualActivityInput').value
    };

    localStorage.setItem('healthProfile', JSON.stringify(profile));
    document.getElementById('result').textContent = 'Profile saved successfully!';
    
    populateProfile(profile);
    setCurrentPage(0);
    
    // After saving, redirect to the saved profile page
    window.location.href = '/saved-profile';
  };

  const populateProfile = (profile) => {
    document.getElementById('profileForm').style.display = 'none';
    document.getElementById('savedProfile').style.display = 'block';
    document.getElementById('savedAge').textContent = profile.age || 'Not provided';
    document.getElementById('savedWeight').textContent = profile.weight || 'Not provided';
    document.getElementById('savedBloodType').textContent = profile.bloodType || 'Not provided';
    document.getElementById('savedHeight').textContent = profile.height || 'Not provided';
    document.getElementById('savedGender').textContent = profile.gender || 'Not provided';
    document.getElementById('savedChildren').textContent = profile.children || 'Not provided';
    document.getElementById('savedAllergies').textContent = profile.allergies || 'Not provided';
    document.getElementById('savedChronicConditions').textContent = profile.chronicConditions || 'Not provided';
    document.getElementById('savedTobacco').textContent = profile.tobacco || 'Not provided';
    document.getElementById('savedAlcohol').textContent = profile.alcohol || 'Not provided';
    document.getElementById('savedSurgeries').textContent = profile.surgeries || 'None';
    document.getElementById('savedFamilyHistory').textContent = profile.familyHistory || 'None';
    document.getElementById('savedRecentChanges').textContent = profile.recentChanges || 'Not provided';
    document.getElementById('savedInfectiousAreas').textContent = profile.infectiousAreas || 'Not provided';
    document.getElementById('savedSexualActivity').textContent = profile.sexualActivity || 'Not provided';

    const clientInfo = JSON.parse(localStorage.getItem('clientInfo'));
    document.getElementById('summaryName').textContent = `${clientInfo.firstName} ${clientInfo.lastName}`;
    document.getElementById('summaryAge').textContent = profile.age || 'Not provided';
    document.getElementById('summaryGender').textContent = profile.gender || 'Not provided';
    document.getElementById('summaryPhone').textContent = clientInfo.phone || 'Not provided';
    document.getElementById('summaryAddress').textContent = clientInfo.address || 'Not provided';
    document.getElementById('summaryWeight').textContent = profile.weight || 'Not provided';
    document.getElementById('summaryBloodType').textContent = profile.bloodType || 'Not provided';
    document.getElementById('summaryHeight').textContent = profile.height || 'Not provided';
    document.getElementById('summaryAllergies').textContent = profile.allergies || 'None';
    document.getElementById('summaryChronicConditions').textContent = profile.chronicConditions || 'None';
    document.getElementById('summarySurgeries').textContent = profile.surgeries || 'None';
    document.getElementById('summaryFamilyHistory').textContent = profile.familyHistory || 'None';
  };

  const showForm = () => {
    document.getElementById('profileForm').style.display = 'block';
    document.getElementById('savedProfile').style.display = 'none';
  };

  const showVisitSummary = () => {
    document.getElementById('savedProfile').style.display = 'none';
    document.getElementById('visitSummary').style.display = 'block';
  };

  const openPopup = () => {
    document.getElementById("imagePopup").style.display = "block";
  };

  const closePopup = () => {
    document.getElementById("imagePopup").style.display = "none";
  };

  return (
    <div>
      <h1 id="mainHeading"> Healthyz.</h1>

      <h2 id = "subHeading"> Health at your ease!</h2>
      {isNewSession && (
        <div className="new-session-message">
          <p>Welcome to a new session! Please fill out your profile.</p>
        </div>
      )}
      <div id="clientInfoForm">
        <h2>Information</h2>
        <form>
          <label htmlFor="firstNameInput">First Name:</label>
          <input type="text" id="firstNameInput" required /><br /><br />

          <label htmlFor="lastNameInput">Last Name:</label>
          <input type="text" id="lastNameInput" required /><br /><br />

          <label htmlFor="phoneInput">Phone:</label>
          <input type="tel" id="phoneInput" required /><br /><br />

          <label htmlFor="addressInput">Address:</label>
          <textarea id="addressInput" rows="3" required></textarea><br /><br />

          <button type="button" onClick={saveClientInfo}>Continue</button>
        </form>
      </div>

      <div id="profileForm" style={{ display: 'none' }}>
        <form>
          <div className="page">
            <div className="question">
              <label htmlFor="ageInput">How old are you?</label>
              <input type="number" id="ageInput" min="0" />
            </div>

            <div className="question">
              <label htmlFor="weightInput">How much do you weigh (kg)?</label>
              <input type="number" id="weightInput" min="0" step="0.1" />
            </div>

            <div className="question">
              <label htmlFor="bloodTypeInput">What is your blood type?</label>
              <select id="bloodTypeInput">
                <option value="">Select an option</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>

            <div className="question">
              <label htmlFor="heightInput">What is your height (cm)?</label>
              <input type="number" id="heightInput" min="0" step="0.1" />
            </div>

            <div className="question">
              <label htmlFor="genderInput">What is your Gender?</label>
              <select id="genderInput">
                <option value="">Select an option</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="page">
            <div className="question">
              <label htmlFor="childrenInput">Do you have any Children? If so, how many?</label>
              <input type="text" id="childrenInput" />
            </div>

            <div className="question">
              <label htmlFor="allergiesInput">Do you have any allergies? If so, specify</label>
              <input type="text" id="allergiesInput" />
            </div>

            <div className="question">
              <label htmlFor="chronicConditionsInput">Any Chronic Conditions?</label>
              <input type="text" id="chronicConditionsInput" />
            </div>

            <div className="question">
              <label htmlFor="tobaccoInput">How often do you use tobacco?</label>
              <select id="tobaccoInput">
                <option value="">Select an option</option>
                <option value="Very Often">Very Often (daily or multiple times a day)</option>
                <option value="Often">Often (a few times per week)</option>
                <option value="Rarely">Rarely (less than once a week)</option>
                <option value="Never">Never (don't use tobacco)</option>
              </select>
            </div>

            <div className="question">
              <label htmlFor="alcoholInput">How often do you drink alcohol?</label>
              <select id="alcoholInput">
                <option value="">Select an option</option>
                <option value="Very Often">Very Often (daily or almost daily)</option>
                <option value="Often">Often (1-3 times per week)</option>
                <option value="Rarely">Rarely (less than once a week)</option>
                <option value="Never">Never (don't drink alcohol)</option>
              </select>
            </div>
          </div>

          <div className="page">
            <div className="question">
              <label>Do you have a history of any of the following?</label>
              <div className="checkbox-grid">
                <div className="checkbox-item">
                  <input type="checkbox" id="surgeryBP" name="surgeries" value="High BP" />
                  <label htmlFor="surgeryBP">High BP</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="surgeryHeart" name="surgeries" value="Heart Problems" />
                  <label htmlFor="surgeryHeart">Heart Problems</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="surgeryStroke" name="surgeries" value="Stroke" />
                  <label htmlFor="surgeryStroke">Stroke</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="surgeryDiabetes" name="surgeries" value="Diabetes" />
                  <label htmlFor="surgeryDiabetes">Diabetes</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="surgeryCancer" name="surgeries" value="Cancer" />
                  <label htmlFor="surgeryCancer">Cancer</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="surgeryCOVID" name="surgeries" value="COVID-19" />
                  <label htmlFor="surgeryCOVID">COVID-19</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="surgeryNipah" name="surgeries" value="Nipah virus" />
                  <label htmlFor="surgeryNipah">Nipah virus</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="surgeryZika" name="surgeries" value="Zika virus" />
                  <label htmlFor="surgeryZika">Zika virus</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="surgeryHIV" name="surgeries" value="HIV/AIDS" />
                  <label htmlFor="surgeryHIV">HIV/AIDS</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="surgeryMalaria" name="surgeries" value="Malaria" />
                  <label htmlFor="surgeryMalaria">Malaria</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="surgeryAsthma" name="surgeries" value="Asthma" />
                  <label htmlFor="surgeryAsthma">Asthma</label>
                </div>
                </div>
              </div>
            
            <div className="question">
              <label>Do you have a family history of any of the following?</label>
              <div className="checkbox-grid">
                <div className="checkbox-item">
                  <input type="checkbox" id="familyHistoryBP" name="familyHistory" value="High BP" />
                  <label htmlFor="familyHistoryBP">High BP</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="familyHistoryHeart" name="familyHistory" value="Heart Disease" />
                  <label htmlFor="familyHistoryHeart">Heart Disease</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="familyHistoryStroke" name="familyHistory" value="Stroke" />
                  <label htmlFor="familyHistoryStroke">Stroke</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="familyHistoryDiabetes" name="familyHistory" value="Diabetes" />
                  <label htmlFor="familyHistoryDiabetes">Diabetes</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="familyHistoryCancer" name="familyHistory" value="Cancer" />
                  <label htmlFor="familyHistoryCancer">Cancer</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="familyHistoryCOVID" name="familyHistory" value="COVID-19" />
                  <label htmlFor="familyHistoryCOVID">COVID-19</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="familyHistoryNipah" name="familyHistory" value="Nipah virus" />
                  <label htmlFor="familyHistoryNipah">Nipah virus</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="familyHistoryZika" name="familyHistory" value="Zika virus" />
                  <label htmlFor="familyHistoryZika">Zika virus</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="familyHistoryHIV" name="familyHistory" value="HIV/AIDS" />
                  <label htmlFor="familyHistoryHIV">HIV/AIDS</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="familyHistoryMalaria" name="familyHistory" value="Malaria" />
                  <label htmlFor="familyHistoryMalaria">Malaria</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="familyHistoryAsthma" name="familyHistory" value="Asthma" />
                  <label htmlFor="familyHistoryAsthma">Asthma</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="familyHistoryTB" name="familyHistory" value="Tuberculosis" />
                  <label htmlFor="familyHistoryTB">Tuberculosis</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="familyHistoryOther" name="familyHistory" value="Other" />
                  <label htmlFor="familyHistoryOther">Other</label>
                </div>
              </div>
            </div>

            <div className="question">
              <label htmlFor="recentChangesInput">Have you noticed any recent changes in weight, appetite, or energy levels?</label>
              <textarea id="recentChangesInput" rows="3" cols="50"></textarea>
            </div>

            <div className="question">
              <label htmlFor="infectiousAreas">Have you recently been to areas with infectious diseases (ex: malaria, dengue, etc)?</label>
              <select id="infectiousAreas" name="infectiousAreas">
                <option value="">Select an option</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className="question">
              <label htmlFor="sexualActivityInput">Are you sexually active? If so, do you use protection?</label>
              <select id="sexualActivityInput">
                <option value="">Select an option</option>
                <option value="Yes, but do not use protection">Yes, but do not use protection</option>
                <option value="Yes, always use protection">Yes, always use protection (condoms, birth control, etc.)</option>
                <option value="Yes, sometimes use protection">Yes, sometimes use protection</option>
                <option value="Not sexually active">Not sexually active</option>
              </select>
            </div>
          </div>
        </form>
        <div id="navigation">
          <button type="button" id="prevButton" onClick={prevQuestion}>Previous</button>
          <button type="button" id="nextButton" onClick={nextQuestion}>Next</button>
          <button type="button" id="saveButton" onClick={saveProfile} style={{ display: 'none' }}>Save Profile</button>
        </div>
        <div id="pageNumber"></div>
        <p id="result"></p>
        <Link to="/saved-profile">View Saved Profile</Link>
      </div>

      <div id="savedProfile" style={{ display: 'none' }}>
        <h2>Saved Profile</h2>
        <p><strong>Age:</strong> <span id="savedAge"></span></p>
        <p><strong>Weight:</strong> <span id="savedWeight"></span> kg</p>
        <p><strong>Blood Type:</strong> <span id="savedBloodType"></span></p>
        <p><strong>Height:</strong> <span id="savedHeight"></span> cm</p>
        <p><strong>Gender:</strong> <span id="savedGender"></span></p>
        <p><strong>Children:</strong> <span id="savedChildren"></span></p>
        <p><strong>Allergies:</strong> <span id="savedAllergies"></span></p>
        <p><strong>Chronic Conditions:</strong> <span id="savedChronicConditions"></span></p>
        <p><strong>Tobacco Use:</strong> <span id="savedTobacco"></span></p>
        <p><strong>Alcohol Consumption:</strong> <span id="savedAlcohol"></span></p>
        <p><strong>Medical History:</strong> <span id="savedSurgeries"></span></p>
        <p><strong>Family History:</strong> <span id="savedFamilyHistory"></span></p>
        <p><strong>Recent Changes:</strong> <span id="savedRecentChanges"></span></p>
        <p><strong>Recent visit to infectious areas:</strong> <span id="savedInfectiousAreas"></span></p>
        <p><strong>Sexual Activity:</strong> <span id="savedSexualActivity"></span></p>
        <button type="button" onClick={showForm}>Edit Profile</button>
        <button type="button" onClick={showVisitSummary}>View Visit Summary</button>
      </div>

      <div id="visitSummary" style={{ display: 'none' }}>
        <div id="clickableImage">
          <button onClick={openPopup} className="microphone-button">
            <img src="MicrophoneHopHacks.jpg" alt="Clickable Image" />
          </button>
        </div>

        <h2>Visit Summary</h2>

        <div id="details" className="tab-content">
          <h3>Visitor Details</h3>
          <p><strong>Name:</strong> <span id="summaryName"></span></p>
          <p><strong>Age:</strong> <span id="summaryAge"></span></p>
          <p><strong>Gender:</strong> <span id="summaryGender"></span></p>
          <p><strong>Phone:</strong> <span id="summaryPhone"></span></p>
          <p><strong>Address:</strong> <span id="summaryAddress"></span></p>
        </div>

        <div id="vitals" className="tab-content">
          <h3>Vitals</h3>
          <p><strong>Weight:</strong> <span id="summaryWeight"></span> kg</p>
          <p><strong>Blood Type:</strong> <span id="summaryBloodType"></span></p>
          <p><strong>Height:</strong> <span id="summaryHeight"></span> cm</p>
        </div>

        <div id="history" className="tab-content">
          <h3>Medical History</h3>
          <p><strong>Allergies:</strong> <span id="summaryAllergies"></span></p>
          <p><strong>Chronic Conditions:</strong> <span id="summaryChronicConditions"></span></p>
          <p><strong>Surgeries:</strong> <span id="summarySurgeries"></span></p>
          <p><strong>Family History:</strong> <span id="summaryFamilyHistory"></span></p>
        </div>
      </div>

      <div id="imagePopup" className="popup" style={{ display: 'none' }}>
        <div className="popup-content">
          <span className="close" onClick={closePopup}>&times;</span>
          <p>ADD THE SPEECH TO TEXT FUNCTIONALITY HERE</p>
        </div>
      </div>
    </div>
  );
};

export default HealthProfile;
