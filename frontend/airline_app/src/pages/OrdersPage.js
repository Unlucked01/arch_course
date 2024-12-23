import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert } from 'react-bootstrap';

function OrdersPage({ token }) {
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tickets data from the backend
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/admin/orders/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to fetch tickets');
        }

        const data = await response.json();
        setTickets(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (token) {
      fetchTickets();
    } else {
      setError('Unauthorized. Please log in.');
      setLoading(false);
    }
  }, [token]);

  // Aggregate tickets by user_id
  useEffect(() => {
    const aggregateOrders = () => {
      const aggregation = {};

      tickets.forEach(ticket => {
        const { user_id, price } = ticket;

        if (aggregation[user_id]) {
          aggregation[user_id].order_count += 1;
          aggregation[user_id].total_price += price;
        } else {
          aggregation[user_id] = {
            user_id: user_id,
            order_count: 1,
            total_price: price
          };
        }
      });

      // Convert the aggregation object to an array
      const aggregatedData = Object.values(aggregation);
      setOrders(aggregatedData);
    };

    if (tickets.length > 0) {
      aggregateOrders();
    }
  }, [tickets]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="mt-3">
        {error}
      </Alert>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Агрегированные заказы</h2>
      {orders.length === 0 ? (
        <p className="text-muted">Нет заказов для отображения.</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Пользователь ID</th>
              <th>Количество заказов</th>
              <th>Общая сумма (₽)</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.user_id}>
                <td>{order.user_id}</td>
                <td>{order.order_count}</td>
                <td style={{ color: 'green', fontWeight: 'bold' }}>
                  {order.total_price.toLocaleString('ru-RU')} ₽
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default OrdersPage;
