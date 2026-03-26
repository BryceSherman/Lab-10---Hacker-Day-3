import { useEffect, useState } from "react";
import axios from "axios";

const Body = () => {
  const [puppies, setPuppies] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    age: "",
  });

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const fetchPuppies = async () => {
    try {
      const response = await axios.get(apiUrl);
      setPuppies(response.data);
    } catch (error) {
      console.error("Error fetching puppies:", error);
    }
  };

  useEffect(() => {
    fetchPuppies();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(apiUrl, {
        name: formData.name,
        breed: formData.breed,
        age: Number(formData.age),
      });

      setFormData({
        name: "",
        breed: "",
        age: "",
      });

      fetchPuppies();
    } catch (error) {
      console.error("Error adding puppy:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${apiUrl}/${id}`);
      fetchPuppies();
    } catch (error) {
      console.error("Error deleting puppy:", error);
    }
  };

  return (
    <main className="body">
      <h2>Puppy Records</h2>

      <div className="button-group">
        <button type="button">Add Puppy</button>
      </div>

      <form className="puppy-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="breed"
          placeholder="Breed"
          value={formData.breed}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={formData.age}
          onChange={handleChange}
          required
        />
        <button type="submit">Submit</button>
      </form>

      <table className="puppy-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Breed</th>
            <th>Age</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {puppies.map((puppy) => (
            <tr key={puppy.id}>
              <td>{puppy.id}</td>
              <td>{puppy.name}</td>
              <td>{puppy.breed}</td>
              <td>{puppy.age}</td>
              <td>
                <button type="button">Edit</button>
                <button type="button" onClick={() => handleDelete(puppy.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};

export default Body;