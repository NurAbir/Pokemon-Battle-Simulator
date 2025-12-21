/* PokemonModel.js - Enhanced Logic */
import { useState, useEffect } from 'react';

export const PokemonModel = () => {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // Tracks active edit session
  
  const initialForm = {
    name: '', type: '', rating: 'B', moves: '', image: '',
    baseStats: { hp: 100, attack: 50 }
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/pokemon');
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch (err) { console.error("Fetch error", err); }
  };

  // Pre-populate form for editing
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      ...item,
      moves: item.moves.join(', '), // Convert array to string for the input field
      baseStats: item.baseStats || { hp: 100, attack: 50 }
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!editingItem;
    const url = isEdit ? `http://localhost:5000/api/pokemon/${editingItem._id}` : 'http://localhost:5000/api/pokemon';
    
    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (isEdit) {
        setItems(items.map(i => i._id === editingItem._id ? data : i));
      } else {
        setItems([...items, data]);
      }
      closeModal();
    } catch (err) { console.error("Submission failed", err); }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData(initialForm);
  };

const handleDelete = async (id) => {
    try {
      // API call to delete the entity
      const res = await fetch(`http://localhost:5000/api/pokemon/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        // Update local state by filtering out the deleted item
        setItems(prevItems => prevItems.filter(i => i._id !== id));
        console.log(`Pokemon with ID ${id} deleted successfully.`);
      } else {
        console.error("Deletion failed on server. Status:", res.status);
      }
    } catch (err) {
      console.error("Deletion failed", err);
    }
  };

  return {
    items, showModal, setShowModal, formData, setFormData, editingItem, 
    handleSubmit, handleEdit, handleDelete, closeModal,
    getRatingColor: (r) => ({ S: 'text-purple-400', A: 'text-yellow-400', B: 'text-blue-400' }[r] || 'text-gray-400')
  };
};