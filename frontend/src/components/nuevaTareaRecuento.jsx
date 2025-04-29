import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/nuevaTarea.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const NuevaTareaRecuento = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  
  const [nombreTarea, setNombreTarea] = useState('');
  const [descripcionTarea, setDescripcionTarea] = useState('');
  const [selectedAliases, setSelectedAliases] = useState([]);
  const [aliasOptions, setAliasOptions] = useState([]);
  const [aliasSearchTerm, setAliasSearchTerm] = useState('');
  const [showAliasDropdown, setShowAliasDropdown] = useState(false);
  
  // Función para buscar alias
  const handleAliasSearch = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/tareas/alias/search`, {
        params: {
          term: aliasSearchTerm,
          idIdioma: languageId
        }
      });
      
      setAliasOptions(response.data || []);
      setShowAliasDropdown(true);
    } catch (error) {
      console.error('Error al buscar alias:', error);
    }
  };
  
  // Función para seleccionar un alias
  const handleSelectAlias = (alias) => {
    if (!selectedAliases.some(a => a.id === alias.id)) {
      setSelectedAliases([...selectedAliases, alias]);
    }
    setAliasSearchTerm('');
    setShowAliasDropdown(false);
  };
  
  // Función para eliminar un alias seleccionado
  const handleRemoveAlias = (aliasId) => {
    setSelectedAliases(selectedAliases.filter(alias => alias.id !== aliasId));
  };
  
  // Función para crear la tarea
  const handleSubmit = async () => {
    try {
      const tareaData = {
        nombreTarea,
        descripcionTarea,
        idTipoTarea: 2, // 2 para Recuento
        idIdioma: languageId,
        aliases: selectedAliases.map(alias => alias.id)
      };
      
      await axios.post(`${BASE_URL}/api/tareas`, tareaData);
      
      // Navegar de vuelta a la lista de tareas
      navigate('/tareas');
      
    } catch (error) {
      console.error('Error al crear la tarea:', error);
      // Aquí podrías mostrar un mensaje de error
    }
  };
  
  const handleCancel = () => {
    navigate('/tareas');
  };
  
  return (
    <div className="nueva-tarea-container">
      <h1 className="nueva-tarea-title">
        NUEVA TAREA RECUENTO
      </h1>
      
      <div>
        <div className="paso-title">
          <span className="paso-number">PASO 1 -</span>DATOS GENERALES DE LA TAREA
        </div>
        
        <div className="input-container">
          <input
            type="text"
            className="tarea-input"
            placeholder="Nombre de la tarea *"
            value={nombreTarea}
            onChange={(e) => setNombreTarea(e.target.value)}
            maxLength={50}
          />
          <small className="counter">{nombreTarea.length} / 50</small>
        </div>
        
        <div className="input-container">
          <textarea
            className="tarea-textarea"
            placeholder="Descripción de la tarea *"
            value={descripcionTarea}
            onChange={(e) => setDescripcionTarea(e.target.value)}
            maxLength={200}
          />
          <small className="counter">{descripcionTarea.length} / 200</small>
        </div>
      </div>
      
      <div>
        <div className="paso-title">
          <span className="paso-number">PASO 2 -</span>ALIAS Y ÁMBITO QUE INCUIRÁ ESTA TAREA
        </div>
        
        <div className="alias-select-container">
          <select 
            className="alias-select" 
            value={aliasSearchTerm} 
            onChange={(e) => setAliasSearchTerm(e.target.value)}
          >
            <option value="">Id o Nombre de Alias *</option>
            {aliasOptions.map(alias => (
              <option key={alias.id} value={alias.id}>
                {alias.id} - {alias.nombre}
              </option>
            ))}
          </select>
        </div>
        
        <div className="selected-aliases-container">
          <div className="no-aliases-message">
            <div className="search-icon">
              <FaSearch size={30} />
            </div>
            <p className="no-aliases-text">NO HAY ALIAS SELECCIONADOS</p>
            <p className="aliases-help-text">UTILIZAR LOS CAMPOS NECESARIOS PARA AÑADIR ALIAS A LA TAREA</p>
          </div>
        </div>
      </div>
      
      <div className="buttons-container">
        <button className="cancel-button" onClick={handleCancel}>
          CANCELAR
        </button>
        <button
          className="create-button"
          onClick={handleSubmit}
          disabled={!nombreTarea || !descripcionTarea || selectedAliases.length === 0}
        >
          CREAR
        </button>
      </div>
    </div>
  );
};

export default NuevaTareaRecuento;