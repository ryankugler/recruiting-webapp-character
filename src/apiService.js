const API_URL = 'https://recruiting.verylongdomaintotestwith.ca/api/{ryankugler}/character';

// Function to save characters (POST request)
export const saveCharactersToAPI = async (characters) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ characters }),
    });
    if (!response.ok) {
      throw new Error('Failed to save characters');
    }
    console.log('Characters saved successfully');
  } catch (error) {
    console.error('Error saving characters:', error);
  }
};

export const loadCharactersFromAPI = async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to load characters');
      }
      
      const data = await response.json();  
      // Check if characters are nested in the body object
      if (data.body && data.body.characters) {
        return data.body.characters; // Extract the characters from the body
      } else {
        console.log('No characters found in the API response body.');
        return [];
      }
    } catch (error) {
      console.error('Error loading characters:', error);
      return [];
    }
  };
  