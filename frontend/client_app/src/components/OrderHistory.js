import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroller";

function OrderHistory({ token }) {
  const [orders, setOrders] = useState([]);
  const [displayedOrders, setDisplayedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/orders', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
        setDisplayedOrders(data.slice(0, 16)); // Load the first 16 orders
        setHasMore(data.length > 16); // Check if more orders exist
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to fetch orders');
      }
    } catch (err) {
      setError('Error fetching order history');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreOrders = () => {
    const currentLength = displayedOrders.length;
    const nextChunk = orders.slice(currentLength, currentLength + 16);
    setDisplayedOrders([...displayedOrders, ...nextChunk]);
    setHasMore(orders.length > currentLength + nextChunk.length);
  };

  const handleRedirectFlights = () => {
    navigate('/flights');
  };

  const handleRedirectTickets = () => {
    navigate('/tickets');
  };

  if (loading) {
    return <div className="container mt-5">Загрузка заказов...</div>;
  }

  if (error) {
    return <div className="container mt-5 alert alert-danger">Error: {error}</div>;
  }

  return (
      <div className={"container mt-5 position relative"}>
          <div
              style={{
                  position: 'absolute',
                  top: '40px',
                  right: '60px',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
              }}
              onClick={handleRedirectFlights}
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none"
                   stroke="#000000" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
          </div>
          <div
              style={{
                  position: "absolute",
                  top: "41px",
                  right: "100px",
                  width: "40px",
                  height: "40px",
                  cursor: "pointer",
              }}
              onClick={handleRedirectTickets}
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none"
                   stroke="#000000" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="round">
                  <circle cx="10" cy="20.5" r="1"/>
                  <circle cx="18" cy="20.5" r="1"/>
                  <path d="M2.5 2.5h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6l1.6-8.4H7.1"/>
              </svg>
          </div>
          <h2>История заказов</h2>
    <div className="container mt-2 position-relative" style={{height: '100vh', overflow: 'auto'}}>
        {
            orders.length === 0 ? (<div className="alert alert-warning">Не найдено заказов.</div>) :
                (
                    <InfiniteScroll
                        pageStart={0}
                        loadMore={loadMoreOrders}
                        hasMore={hasMore}
                        loader={<div className="loader" key={0}>Загрузка...</div>}
                        useWindow={false}
                    >
                        <div className="row">
                            {displayedOrders.map(order => (
                                <div className="col-md-4" key={order.order_id}>
                                    <div className="card mb-3 shadow-sm" style={{borderRadius: '10px'}}>
                                        <div className="card-body">
                                            <h5 className="card-title">Заказ: {order.order_id}</h5>
                                            <p className="card-text">
                                                <strong>ID Билета:</strong> {order.ticket_id}<br/>
                                                <strong>Сумма:</strong> {order.price}<br/>
                                                <strong>Статус:</strong>
                                                <text style={{color: 'green'}}> {order.status === "created" ? "создан" : "несоздан"}</text>
                                                <br/>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                </InfiniteScroll>
            )
        }
    </div>
      </div>
  );
}

export default OrderHistory;



