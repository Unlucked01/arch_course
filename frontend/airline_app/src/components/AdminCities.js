import React, { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroller';

function AdminCities({ token }) {
  const [allCities, setAllCities] = useState([]);
  const [displayedCities, setDisplayedCities] = useState([]);
  const [hasMoreCities, setHasMoreCities] = useState(false);

  const [newCity, setNewCity] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCities();
    }
  }, [token]);

  // Fetch all cities
  const fetchCities = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/dictionaries/cities', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Ошибка при загрузке городов');
      }
      const data = await response.json(); // e.g. [{ name: "Москва" }, { name: "Санкт-Петербург" }] or array of strings
      setAllCities(data);

      // Initialize for infinite scroll
      const firstChunk = data.slice(0, 5);
      setDisplayedCities(firstChunk);
      setHasMoreCities(data.length > 5);
    } catch (error) {
      console.error(error);
      setAlertMessage(error.message);
      setShowAlert(true);
    }
  };

  // Load more cities for infinite scroll
  const loadMoreCities = () => {
    const currentLen = displayedCities.length;
    const nextChunk = allCities.slice(currentLen, currentLen + 5);

    setDisplayedCities((prev) => [...prev, ...nextChunk]);
    if (currentLen + nextChunk.length >= allCities.length) {
      setHasMoreCities(false);
    }
  };

  // Add city
  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!newCity) return;

    try {
      const response = await fetch('http://127.0.0.1:8000/dictionaries/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка при добавлении города');
      }

      setAlertMessage(`Город "${newCity}" успешно добавлен!`);
      setShowAlert(true);
      setNewCity('');
      await fetchCities(); // Refresh
    } catch (error) {
      console.error(error);
      setAlertMessage(error.message);
      setShowAlert(true);
    }
  };

  // Delete city
  const handleDeleteCity = async (cityName) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/dictionaries/city?city_name=${cityName}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка при удалении города');
      }

      setAlertMessage(`Город "${cityName}" удалён.`);
      setShowAlert(true);
      await fetchCities(); // Refresh
    } catch (error) {
      console.error(error);
      setAlertMessage(error.message);
      setShowAlert(true);
    }
  };

  return (
    <div className="card p-3" style={{height: '730px'}}>
      <h5>Управление городами</h5>

      {/* Add City Form */}
      <form onSubmit={handleAddCity} className="row g-3 align-items-center mb-3">
        <div className="col-8">
          <input
            type="text"
            className="form-control"
            placeholder="Название города"
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
          />
        </div>
        <div className="col-4">
          <button type="submit" className="btn w-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none"
                 stroke="#000000" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </form>

      {/* Cities List with Infinite Scroll */}
      <div
          style={{
            height: '600px',
            overflow: 'auto',
            border: '1px solid #ccc',
            borderRadius: '5px',
            padding: '10px',
          }}
      >
        <InfiniteScroll
            pageStart={0}
            loadMore={loadMoreCities}
          hasMore={hasMoreCities}
          loader={<div key={0}>Загрузка...</div>}
          useWindow={false}
        >
          {displayedCities.length === 0 ? (
            <p className="text-muted">Нет городов</p>
          ) : (
            displayedCities.map((cityObj, index) => {
              const cityName = cityObj.name || cityObj;
              return (
                <div
                  key={index}
                  className="d-flex justify-content-between align-items-center mb-2"
                >
                  <div>{cityName}</div>
                  <button
                      className="btn btn-a"
                      onClick={() => handleDeleteCity(cityName)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                         stroke="#000000" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </InfiniteScroll>
      </div>
    </div>
  );
}

export default AdminCities;
