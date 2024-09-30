import { useState, useEffect } from 'react';
import './App.css';
import { ATTRIBUTE_LIST, CLASS_LIST, SKILL_LIST } from './consts.js';
import { saveCharactersToAPI, loadCharactersFromAPI } from './apiService'; 

function App() {

  // ------------------- Constants -------------------
  const initialCharacter = {
    attributes: ATTRIBUTE_LIST.reduce((acc, attr) => ({ ...acc, [attr]: 10 }), {}),
    skills: SKILL_LIST.reduce((acc, skill) => ({ ...acc, [skill.name]: 0 }), {}),
  };

  const calculateModifier = (value) => Math.floor((value - 10) / 2);
  const maxAttributeTotal = 70;

  // ------------------- State -------------------
  const [characters, setCharacters] = useState([{ id: 1, ...initialCharacter }]); 
  const [selectedCharacterId, setSelectedCharacterId] = useState(1); 
  const [selectedSkill, setSelectedSkill] = useState(SKILL_LIST[0].name);
  const [dc, setDc] = useState(10);
  const [rollResult, setRollResult] = useState(null);
  const [skillCheckResult, setSkillCheckResult] = useState('');
  const [mathBreakdown, setMathBreakdown] = useState('');

  // ------------------- API Integration -------------------
  useEffect(() => {
    const fetchCharacters = async () => {
      const loadedCharacters = await loadCharactersFromAPI();
      if (loadedCharacters && loadedCharacters.length > 0) {
        console.log('Loaded characters:', loadedCharacters); //  for debugging
        setCharacters(loadedCharacters);
        setSelectedCharacterId(loadedCharacters[0].id); // default to first character
      } else {
        console.log('No characters found in the API. Using default character.');
        setCharacters([{ id: 1, ...initialCharacter }]); // default character
      }
    };
    fetchCharacters();
  }, []);

  const saveAllCharacters = () => {
    saveCharactersToAPI(characters); // save all characters to the API
  };

  // ------------------- Character Management -------------------
  const addCharacter = () => {
    const newId = characters.length > 0 ? characters[characters.length - 1].id + 1 : 1;
    const newCharacters = [...characters, { id: newId, ...initialCharacter }];
    setCharacters(newCharacters);
    setSelectedCharacterId(newId); // select newly added character
  };

  const selectedCharacter = characters.find(char => char.id === selectedCharacterId);
  const totalAttributes = Object.values(selectedCharacter.attributes).reduce((acc, value) => acc + value, 0);
  const intelligenceModifier = calculateModifier(selectedCharacter.attributes['Intelligence']);
  const totalSkillPoints = 10 + (4 * intelligenceModifier);
  const spentSkillPoints = Object.values(selectedCharacter.skills).reduce((acc, val) => acc + val, 0);
  const availableSkillPoints = totalSkillPoints - spentSkillPoints;

  const handleAttributeChange = (attribute, increment) => {
    setCharacters(prevCharacters => prevCharacters.map(char => {
      if (char.id === selectedCharacterId) {
        const newAttributes = { ...char.attributes };
        const newTotal = totalAttributes + increment;

        if (newTotal <= maxAttributeTotal && newAttributes[attribute] + increment >= 0) {
          newAttributes[attribute] += increment;
        }
        return { ...char, attributes: newAttributes };
      }
      return char;
    }));
  };

  const handleSkillChange = (skillName, increment) => {
    if ((availableSkillPoints > 0 && increment > 0) || increment < 0) {
      setCharacters(prevCharacters => prevCharacters.map(char => {
        if (char.id === selectedCharacterId) {
          const newSkills = { ...char.skills };
          newSkills[skillName] = Math.max(0, newSkills[skillName] + increment);
          return { ...char, skills: newSkills };
        }
        return char;
      }));
    }
  };

  // ------------------- Skill Check Section -------------------
  const performSkillCheck = () => {
    const roll = Math.floor(Math.random() * 20) + 1; // Roll a random number between 1 and 20
    const skillModifier = calculateModifier(selectedCharacter.attributes[SKILL_LIST.find(skill => skill.name === selectedSkill).attributeModifier]);
    const skillPoints = selectedCharacter.skills[selectedSkill];
    const total = roll + skillModifier + skillPoints;

    setRollResult(roll);

    if (total >= dc) {
      setSkillCheckResult('Success');
    } else {
      setSkillCheckResult('Failure');
    }
    setMathBreakdown(`
      Roll: ${roll} + Skill Points: ${skillPoints} + Skill Modifier: ${skillModifier} = Total: ${total} vs DC: ${dc}
    `);
  };

  const isEligibleForClass = (className) => {
    const classRequirements = CLASS_LIST[className];
    return ATTRIBUTE_LIST.every(attr => selectedCharacter.attributes[attr] >= classRequirements[attr]);
  };

  // ------------------- UI -------------------
  return (
    <div className="App">
      <header className="App-header">
        <h1>Create Your Character</h1>
      </header>

      {/* Character Selection Section */}
      <section className="App-section">
        <h2>Character {selectedCharacterId} </h2>
        {characters.map(char => (
          <div key={char.id}>
            <button className="character-button" onClick={() => setSelectedCharacterId(char.id)}>
              Select Character {char.id}
            </button>
          </div>
        ))}
        <button onClick={addCharacter}>Add New Character</button>
        <button onClick={saveAllCharacters}>Save Characters</button>
      </section>

      {/* Attributes Section */}
      <section className="App-section">
        <h2>Attributes (Total: {totalAttributes} / {maxAttributeTotal})</h2>
        {ATTRIBUTE_LIST.map(attr => (
          <div key={attr}>
            <span>{attr}: {selectedCharacter.attributes[attr]} (Modifier: {calculateModifier(selectedCharacter.attributes[attr])})</span>
            <button onClick={() => handleAttributeChange(attr, 1)} disabled={totalAttributes >= maxAttributeTotal}>+</button>
            <button onClick={() => handleAttributeChange(attr, -1)}>-</button>
          </div>
        ))}
      </section>

      {/* Class Eligibility Section */}
      <section className="App-section">
        <h2>Available Classes</h2>
        <div className="class-cards">
          {Object.keys(CLASS_LIST).map(className => {
            const eligible = isEligibleForClass(className); // Determine eligibility
            return (
              <div key={className} className={`class-card ${eligible ? '' : 'greyed-out'}`}>
                <h3>{className}</h3>
                {eligible && <p style={{ fontWeight: 'bold', color: 'green' }}>ELIGIBLE</p>} {/* Eligibility indicator */}
                <p>Requirements:</p>
                <ul>
                  {ATTRIBUTE_LIST.map(attr => (
                    <li key={attr}>{attr}: {CLASS_LIST[className][attr]}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Skill Check Section */}
      <section className="App-section">
        <h2>Skill Check</h2>
        <label>
          Select Skill:
          <select value={selectedSkill} onChange={(e) => setSelectedSkill(e.target.value)}>
            {SKILL_LIST.map(skill => (
              <option key={skill.name} value={skill.name}>{skill.name}</option>
            ))}
          </select>
        </label>
        <label>
          Set DC (Difficulty Class):
          <input type="number" value={dc} onChange={(e) => setDc(e.target.value)} />
        </label>
        <button onClick={performSkillCheck}>Roll</button>
        {rollResult !== null && (
          <div>
            <p>Roll: {rollResult}</p>
            <p>Skill Check Result: </p>
            <p style={ {fontWeight: 'bold', color: 'Blue'}}> {skillCheckResult}</p>
            <p style={{fontStyle: 'italic'}}>({mathBreakdown})</p> {/* Display the math breakdown */}
          </div>
        )}
      </section>

      {/* Skills Section */}
      <section className="App-section">
        <h2>Skills</h2>
        <p>Available Skill Points: {availableSkillPoints}</p>
        {SKILL_LIST.map(skill => (
          <div key={skill.name}>
            <span>{skill.name} - points: {selectedCharacter.skills[skill.name]} (Modifier: {calculateModifier(selectedCharacter.attributes[skill.attributeModifier])})</span>
            <button onClick={() => handleSkillChange(skill.name, 1)} disabled={availableSkillPoints <= 0}>+</button>
            <button onClick={() => handleSkillChange(skill.name, -1)}>-</button>
          </div>
        ))}
      </section>
    </div>
  );
}

export default App;