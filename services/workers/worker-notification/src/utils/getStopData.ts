export const getStopData = async (stopId: string) => {
  const STOP_URL = `http://api.thebus.org/arrivalsJSON/?key=${process.env.API_KEY}&stop=${stopId}`;

  const response = await fetch(STOP_URL);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return await response.json();
};
