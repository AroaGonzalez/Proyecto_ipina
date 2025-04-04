import React, { useEffect, useState, useContext } from 'react';  
import { FaFilter, FaPlay, FaPause, FaSave } from 'react-icons/fa';  
import axios from 'axios';
import { FaSyncAlt, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';  
import '../styles/inventarioList.css';  
import { LanguageContext } from '../context/LanguageContext';  
import { useTranslation } from 'react-i18next';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';  
const INVENTARIO_ENDPOINT = `${BASE_URL}/inventario`;

function InventarioList() {  
 const { t } = useTranslation();  
 const navigate = useNavigate();  
 const [inventarios, setInventarios] = useState([]);  
 const [filteredInventarios, setFilteredInventarios] = useState([]);  
 const [filter, setFilter] = useState('');  
 const [loading, setLoading] = useState(true);  
 const [error, setError] = useState(null);  
 const [mostrarFiltros, setMostrarFiltros] = useState(false);  
 const [selectedItems, setSelectedItems] = useState([]);  
 const [selectAll, setSelectAll] = useState(false);  
 const { languageId } = useContext(LanguageContext);
 const [modifiedItems, setModifiedItems] = useState({});
 const [saveEnabled, setSaveEnabled] = useState(false);
 const [saving, setSaving] = useState(false);

 useEffect(() => {  
   fetchInventario();  
 }, [languageId]);

 useEffect(() => {
   setSaveEnabled(Object.keys(modifiedItems).length > 0);
 }, [modifiedItems]);

 const fetchInventario = () => {  
   setLoading(true);  
   console.log('Obteniendo datos del inventario desde:', `${INVENTARIO_ENDPOINT}?idIdioma=${languageId}`);  
     
   axios  
     .get(`${INVENTARIO_ENDPOINT}?idIdioma=${languageId}`)  
     .then((response) => {  
       console.log('Respuesta API inventario:', response.data);  
         
       const inventarioData = response.data && response.data.content  
         ? response.data.content  
         : Array.isArray(response.data)  
           ? response.data  
           : [];  
         
       console.log('Datos procesados:', inventarioData);  
         
       if (inventarioData.length === 0) {  
         console.warn('No se encontraron datos de inventario en la respuesta');  
       }  
         
       setInventarios(inventarioData);  
       setFilteredInventarios(inventarioData);  
       setLoading(false);
       setModifiedItems({});
     })  
     .catch((error) => {  
       console.error('Error al obtener inventario:', error);  
       if (error.response) {  
         console.error('Detalle de error:', error.response.data);  
         console.error('Status:', error.response.status);  
       }  
       setError(t('No se pudo cargar el inventario. Inténtalo más tarde.'));  
       setLoading(false);  
     });  
 };

 const handleSelectItem = (id) => {  
   setSelectedItems((prevSelected) =>  
     prevSelected.includes(id)  
       ? prevSelected.filter((item) => item !== id)  
       : [...prevSelected, id]  
   );  
 };

 const handleSelectAll = () => {  
   if (selectAll) {  
     setSelectedItems([]);  
   } else {  
     setSelectedItems(filteredInventarios.map((item) => item.idArticulo));  
   }  
   setSelectAll(!selectAll);  
 };

 const handleFilterChange = (e) => {  
   setFilter(e.target.value);  
 };

 const handleSearch = () => {  
   setSelectedItems([]);  
   setSelectAll(false);  
     
   if (filter.trim() === '') {  
     setFilteredInventarios(inventarios);  
   } else {  
     const filtered = inventarios.filter((item) => {  
       const idMatch = item.idArticulo.toString() === filter.trim();  
       if (isNaN(filter)) {  
         return item.articulo.toLowerCase().includes(filter.toLowerCase());  
       }  
       return idMatch;  
     });  
     setFilteredInventarios(filtered);  
   }  
 };

 const handleClearFilter = () => {  
   setFilter('');  
   setFilteredInventarios(inventarios);  
   setSelectedItems([]);  
   setSelectAll(false);  
 };

  const checkAllSelectedItemsStatus = (status) => {
    if (selectedItems.length === 0) return false;
    
    const selectedItemStates = selectedItems.map(id => {
      const item = filteredInventarios.find(item => item.idArticulo === id);
      return (item.estado || "ACTIVO").toLowerCase();
    });

    if (new Set(selectedItemStates).size > 1) {
      return true;
    }

    return selectedItemStates[0] === status.toLowerCase();
  };

 const handleToggleEstado = (nuevoEstado) => {  
   if (selectedItems.length === 0) return;

   console.log(`Cambiando estado a ${nuevoEstado} para IDs:`, selectedItems);

   axios  
     .put(`${BASE_URL}/inventario/estado`, {  
       ids: selectedItems,  
       estado: nuevoEstado  
     })  
     .then((response) => {  
       console.log('Respuesta cambio de estado:', response.data);  
       alert(t(`Estado cambiado a ${nuevoEstado} correctamente para ${selectedItems.length} artículos`));  
       setSelectedItems([]);  
       setSelectAll(false);  
       fetchInventario();  
     })  
     .catch((error) => {  
       console.error('Error al cambiar el estado:', error);  
       if (error.response) {  
         console.error('Detalle:', error.response.data);  
         alert(t(`Error al cambiar el estado: ${error.response.data.message || 'Error desconocido'}`));  
       } else {  
         alert(t('Error al cambiar el estado. Revisa la consola para más detalles.'));  
       }  
     });  
 };

 const handleNewArticle = () => {  
   navigate('/nuevo-articulo');  
 };

 const handleUnidadesBoxChange = (idArticulo, value) => {
   const originalItem = filteredInventarios.find(item => item.idArticulo === idArticulo);
   const originalValue = originalItem?.unidadesBox || "BULTO-PACKAGE";
   
   if (value !== originalValue) {
     setModifiedItems(prev => ({
       ...prev,
       [idArticulo]: {
         ...prev[idArticulo],
         unidadesBox: value
       }
     }));
     
     const selectElement = document.querySelector(`#unidadesBox-${idArticulo}`);
     if (selectElement) {
       selectElement.classList.add('modified');
     }
   } else {
     setModifiedItems(prev => {
       const newModifiedItems = { ...prev };
       if (newModifiedItems[idArticulo]) {
         delete newModifiedItems[idArticulo].unidadesBox;
         
         if (Object.keys(newModifiedItems[idArticulo]).length === 0) {
           delete newModifiedItems[idArticulo];
         }
       }
       return newModifiedItems;
     });
     
     const selectElement = document.querySelector(`#unidadesBox-${idArticulo}`);
     if (selectElement) {
       selectElement.classList.remove('modified');
     }
   }
 };

 const handleUnidadEmpaquetadoChange = (idArticulo, value) => {
   const originalItem = filteredInventarios.find(item => item.idArticulo === idArticulo);
   const originalValue = originalItem?.unidadEmpaquetado?.toString() || "1";
   
   if (value !== originalValue) {
     setModifiedItems(prev => ({
       ...prev,
       [idArticulo]: {
         ...prev[idArticulo],
         unidadEmpaquetado: value
       }
     }));
     
     const inputElement = document.querySelector(`#unidadEmpaquetado-${idArticulo}`);
     if (inputElement) {
       inputElement.classList.add('modified');
     }
   } else {
     setModifiedItems(prev => {
       const newModifiedItems = { ...prev };
       if (newModifiedItems[idArticulo]) {
         delete newModifiedItems[idArticulo].unidadEmpaquetado;
         
         if (Object.keys(newModifiedItems[idArticulo]).length === 0) {
           delete newModifiedItems[idArticulo];
         }
       }
       return newModifiedItems;
     });
     
     const inputElement = document.querySelector(`#unidadEmpaquetado-${idArticulo}`);
     if (inputElement) {
       inputElement.classList.remove('modified');
     }
   }
 };

 const handleMultiploMinimoChange = (idArticulo, value) => {
   const originalItem = filteredInventarios.find(item => item.idArticulo === idArticulo);
   const originalValue = originalItem?.multiploMinimo?.toString() || "1";
   
   if (value !== originalValue) {
     setModifiedItems(prev => ({
       ...prev,
       [idArticulo]: {
         ...prev[idArticulo],
         multiploMinimo: value
       }
     }));
     
     const inputElement = document.querySelector(`#multiploMinimo-${idArticulo}`);
     if (inputElement) {
       inputElement.classList.add('modified');
     }
   } else {
     setModifiedItems(prev => {
       const newModifiedItems = { ...prev };
       if (newModifiedItems[idArticulo]) {
         delete newModifiedItems[idArticulo].multiploMinimo;
         
         if (Object.keys(newModifiedItems[idArticulo]).length === 0) {
           delete newModifiedItems[idArticulo];
         }
       }
       return newModifiedItems;
     });
     
     // Quitar clase visual
     const inputElement = document.querySelector(`#multiploMinimo-${idArticulo}`);
     if (inputElement) {
       inputElement.classList.remove('modified');
     }
   }
 };

 const handleSaveChanges = () => {
   if (!saveEnabled || Object.keys(modifiedItems).length === 0) return;
   
   setSaving(true);
   
   const ajenosToUpdate = Object.entries(modifiedItems).map(([idAjeno, changes]) => {
     const originalItem = filteredInventarios.find(item => item.idArticulo.toString() === idAjeno);
     
     return {
       idAjeno: parseInt(idAjeno),
       unidadesBox: changes.unidadesBox || originalItem.unidadesBox || "BULTO-PACKAGE",
       unidadEmpaquetado: parseFloat(changes.unidadEmpaquetado || originalItem.unidadEmpaquetado || 1),
       multiploMinimo: parseFloat(changes.multiploMinimo || originalItem.multiploMinimo || 1)
     };
   });
   
   axios
     .post(`${BASE_URL}/ajenos/create`, { ajenos: ajenosToUpdate })
     .then(response => {
       console.log('Cambios guardados:', response.data);
       alert(t('Cambios guardados correctamente'));
       setModifiedItems({});
       fetchInventario();
     })
     .catch(error => {
       console.error('Error al guardar cambios:', error);
       alert(t('Error al guardar los cambios. Por favor, inténtalo de nuevo.'));
     })
     .finally(() => {
       setSaving(false);
     });
 };

 const getStatusTagClass = (estado) => {  
   return `status-tag ${estado.toLowerCase()}`;  
 };

 if (loading) return <div className="loading">{t('Cargando inventario...')}</div>;  
 if (error) return <div className="error">{error}</div>;

 const currentTime = new Date().toLocaleTimeString('es-ES', {  
   hour: '2-digit',  
   minute: '2-digit'  
 });

 return (  
   <div className="app-container">  
     <div className="content">  
       <div className="header-section">  
         <h1 className="main-title">{t('CONSULTA DE ARTÍCULOS')}</h1>  
         <div className="header-actions">  
           <button className="filter-button" onClick={() => setMostrarFiltros(!mostrarFiltros)}>  
             <FaFilter /> {mostrarFiltros ? t('OCULTAR FILTROS') : t('MOSTRAR FILTROS')}  
           </button>  
           <button className="new-button" onClick={handleNewArticle}>{t('NUEVO ARTÍCULO')}</button>  
         </div>  
       </div>

       <div className={`filter-section ${mostrarFiltros ? 'show' : ''}`}>  
         <div className="filter-group">  
           <input  
             type="text"  
             placeholder={t('Id Artículo')}  
             value={filter}  
             onChange={handleFilterChange}  
             className="filter-input"  
           />  
           <div className="filter-actions">  
             {filter && (  
               <button  
                 className="clear-button"  
                 onClick={handleClearFilter}  
               >  
                 <span>×</span>  
               </button>  
             )}  
             <button className="search-button-small" onClick={handleSearch}>  
               {t('BUSCAR')}  
             </button>  
           </div>  
         </div>  
       </div>

       {selectedItems.length === 0 ? (
         <div className="info-section">
           <div className="results-info">
              <span className="results-count">
               {t('Cargados {{count}} resultados de {{total}} encontrados', {
                 count: filteredInventarios.length,
                 total: inventarios.length
                })}
             
                {' '}
                <FaSyncAlt className="sync-icon" />
                <span className="update-time">
                  {t('Última actualización')}: {currentTime}
                </span>
              </span>
             <button 
               className={`save-button ${saveEnabled ? 'active' : 'disabled'}`}
               onClick={handleSaveChanges}
               disabled={!saveEnabled || saving}
             >
               <span role="img" aria-label="document">📄</span>
               {saving ? t('GUARDANDO...') : t('GUARDAR CAMBIOS')}
             </button>
           </div>
         </div>
       ) : (
         <div className="selection-info">
           <span className="selected-count">
             {t('Seleccionados {{count}} resultados de {{total}} encontrados', {
               count: selectedItems.length,
               total: inventarios.length
             })}
           </span>
           <div className="btn-actions-container">
             <button 
               className="text-button"
               onClick={() => handleToggleEstado('Activo')}
               disabled={checkAllSelectedItemsStatus('activo')}
             >
               <FaPlay />
               {t('ACTIVAR')}
             </button>
             <div className="button-separator"></div>
             <button 
               className="text-button"
               onClick={() => handleToggleEstado('Pausado')}
               disabled={checkAllSelectedItemsStatus('pausado')}
             >
               <FaPause />
               {t('PAUSAR')}
             </button>
           </div>
         </div>
       )}

       <div className="table-container">  
         <table className="data-table">  
           <thead>  
             <tr>  
               <th className="checkbox-header"><input type="checkbox" checked={selectAll} onChange={handleSelectAll} /></th>  
               <th>{t('ID ARTÍCULO')}</th>  
               <th>{t('ARTÍCULO')}</th>  
               <th>{t('ESTADO RAM')}</th>  
               <th>{t('UNIDADES BOX')}</th>  
               <th>{t('UNIDAD DE EMPAQUETADO')}</th>  
               <th>{t('MÚLTIPLO MÍNIMO')}</th>  
               <th>{t('ESTADO SFI')}</th>  
             </tr>  
           </thead>  
           <tbody>  
             {filteredInventarios && filteredInventarios.length > 0 ? (  
               filteredInventarios.map((item) => (  
                 <tr 
                   key={item.idArticulo}
                   className={selectedItems.includes(item.idArticulo) ? 'selected' : ''}
                 >  
                   <td className="checkbox-cell">
                     <input 
                       type="checkbox" 
                       checked={selectedItems.includes(item.idArticulo)} 
                       onChange={() => handleSelectItem(item.idArticulo)} 
                     />
                   </td>  
                   <td>{item.idArticulo}</td>  
                   <td>{item.articulo}</td>  
                   <td className="status-cell">  
                     <span className={getStatusTagClass(item.estado || "ACTIVO")}>  
                       {(item.estado || "ACTIVO").toUpperCase()}  
                     </span>  
                   </td>  
                   <td>  
                     <select 
                       id={`unidadesBox-${item.idArticulo}`}
                       className="row-select" 
                       defaultValue={item.unidadesBox || "BULTO-PACKAGE"}
                       onChange={(e) => handleUnidadesBoxChange(item.idArticulo, e.target.value)}
                     >  
                       <option value="BULTO-PACKAGE">{t('BULTO-PACKAGE')}</option>  
                       <option value="UNIDAD">{t('UNIDAD')}</option>  
                     </select>  
                   </td>  
                   <td>  
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>  
                       <div className="quantity-input">  
                         <input  
                           id={`unidadEmpaquetado-${item.idArticulo}`}
                           type="number"  
                           defaultValue={item.unidadEmpaquetado || 1}  
                           min="1"  
                           onChange={(e) => handleUnidadEmpaquetadoChange(item.idArticulo, e.target.value)}
                         />  
                       </div>  
                       <span>×</span>  
                     </div>  
                   </td>  
                   <td>  
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>  
                       <div className="quantity-input">  
                         <input  
                           id={`multiploMinimo-${item.idArticulo}`}
                           type="number"  
                           defaultValue={item.multiploMinimo || 1}  
                           min="1"  
                           onChange={(e) => handleMultiploMinimoChange(item.idArticulo, e.target.value)}
                         />  
                       </div>  
                       <span>×</span>  
                     </div>  
                   </td>  
                   <td className="status-cell">  
                     <span className={getStatusTagClass(item.estadoSFI || "ACTIVO")}>  
                       {(item.estadoSFI || "ACTIVO").toUpperCase()}  
                     </span>  
                   </td>  
                 </tr>  
               ))  
             ) : (  
               <tr>  
                 <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>  
                   {t('No se encontraron datos de inventario en la base de datos')}  
                 </td>  
               </tr>  
             )}  
           </tbody>  
         </table>  
       </div>  
     </div>  
   </div>  
 );  
}

export default InventarioList;