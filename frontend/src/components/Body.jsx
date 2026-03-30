import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthContext } from "@asgardeo/auth-react";

const Body = () => {
  const [puppies, setPuppies] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    age: "",
  });
  const [editId, setEditId] = useState(null);

  const { getAccessToken, state } = useAuthContext();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const fetchPuppies = async () => {
    const token = await getAccessToken();

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setPuppies(response.data);
  };

  useEffect(() => {
    if (state?.isAuthenticated) {
      fetchPuppies();
    }
  }, [state?.isAuthenticated]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEdit = (puppy) => {
    setFormData({
      name: puppy.name,
      breed: puppy.breed,
      age: puppy.age,
    });
    setEditId(puppy.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handleSubmit fired");

    const token = await getAccessToken();

    if (editId) {
      await axios.put(
        `${apiUrl}/${editId}`,
        {
          name: formData.name,
          breed: formData.breed,
          age: Number(formData.age),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEditId(null);
    } else {
      await axios.post(
        apiUrl,
        {
          name: formData.name,
          breed: formData.breed,
          age: Number(formData.age),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }

    setFormData({
      name: "",
      breed: "",
      age: "",
    });

    fetchPuppies();
  };

  const handleDelete = async (id) => {
    const token = await getAccessToken();

    await axios.delete(`${apiUrl}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchPuppies();
  };

  return (
    <main className="body">
      <h2>Puppy Records</h2>

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
        <button type="submit">
          {editId ? "Update Puppy" : "Submit"}
        </button>
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
                <button type="button" onClick={() => handleEdit(puppy)}>
                  Edit
                </button>
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