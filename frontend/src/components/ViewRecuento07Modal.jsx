import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import '../styles/viewRecuento07Modal.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const ViewRecuento07Modal = ({ recuento, onClose, onUpdate }) => {
    const { t } = useTranslation();
    const [stockFisico, setStockFisico] = useState(recuento?.stockFisico || '');
    const [capacidadMaxima, setCapacidadMaxima] = useState(recuento?.capacidadMaximaFisica || '');
    const [loading, setLoading] = useState(false);

    if (!recuento) return null;

        const normalizeText = (text) => {
            if (!text) return '';
            
            let normalizedText = String(text);
            
            normalizedText = normalizedText
            .replace(/ESPA.?.'A/g, 'ESPAÑA')
            .replace(/ESPA.?.A/g, 'ESPAÑA')
            .replace(/PEQUE.?.AS/g, 'PEQUEÑAS')
            .replace(/PEQUE.?.A/g, 'PEQUEÑA')
            .replace(/CAMPA.?.A/g, 'CAMPAÑA')
            .replace(/PEQUE.?.OS/g, 'PEQUEÑOS');
        
            const replacements = {
            'Ã\u0081': 'Á', 'Ã\u0089': 'É', 'Ã\u008D': 'Í', 'Ã\u0093': 'Ó', 'Ã\u009A': 'Ú',
            'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
            'Ã\u0091': 'Ñ', 'Ã±': 'ñ',
            'Ã¼': 'ü', 'Ã\u009C': 'Ü',
            'Âº': 'º', 'Âª': 'ª',
            'Ã\u0084': 'Ä', 'Ã\u008B': 'Ë', 'Ã\u008F': 'Ï', 'Ã\u0096': 'Ö', 'Ã\u009C': 'Ü',
            'Ã¤': 'ä', 'Ã«': 'ë', 'Ã¯': 'ï', 'Ã¶': 'ö', 'Ã¼': 'ü',
            'â‚¬': '€',
            'â€"': '–', 'â€"': '—',
            'â€œ': '"', 'â€': '"',
            'â€¢': '•',
            'â€¦': '…',
            'Â¡': '¡', 'Â¿': '¿'
        };
    
        Object.entries(replacements).forEach(([badChar, goodChar]) => {
            normalizedText = normalizedText.replace(new RegExp(badChar, 'g'), goodChar);
        });
    
        return normalizedText;
    };

    const handleAceptar = async () => {
        try {
            setLoading(true);
            
            await axios.put(`${BASE_URL}/recuento/update-estado`, {
                idsRecuento: [recuento.idRecuento],
                idTipoEstadoRecuento: 3, // RESPUESTA
                usuario: 'frontend_user',
                stockFisico: parseInt(stockFisico) || null,
                capacidadMaximaFisica: parseInt(capacidadMaxima) || null
            });

            await axios.get(`${BASE_URL}/recuento/clear-cache`);
            
            if (onUpdate) {
                await onUpdate();
            }
            onClose();
        } catch (error) {
            console.error('Error al actualizar recuento:', error);
            alert('Error al actualizar el recuento');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="modal-overlay">
            <div className="modal-content recuento-07">
            <div className="modal-header">
                <h2>{t('Simulación Aplicación 07 - Recuento')} #{recuento.idRecuento}</h2>
                <button className="close-button" onClick={onClose}>
                <FaTimes />
                </button>
            </div>
            
            <div className="modal-body">
                <div className="recuento-section">
                <h3>{t('Información General')}</h3>
                <div className="info-grid">
                    <div className="info-item">
                    <label>{t('ID Evento:')}</label>
                    <span>{recuento.evento.id}</span>
                    </div>
                    <div className="info-item">
                    <label>{t('Evento:')}</label>
                    <span>{recuento.evento.nombre}</span>
                    </div>
                    <div className="info-item">
                    <label>{t('Estado:')}</label>
                    <span className="status-recogido">{recuento.tipoEstadoRecuento.descripcion}</span>
                    </div>
                    <div className="info-item">
                    <label>{t('Código Ejecución:')}</label>
                    <span>{recuento.codEjecucion}</span>
                    </div>
                </div>
                </div>

                <div className="recuento-section">
                <h3>{t('Localización')}</h3>
                <div className="info-grid">
                    <div className="info-item">
                    <label>ID:</label>
                    <span>{recuento.localizacionCompra.id}</span>
                    </div>
                    <div className="info-item">
                    <label>{t('Descripción:')}</label>
                    <span>{recuento.localizacionCompra.descripcion}</span>
                    </div>
                    <div className="info-item">
                    <label>{t('Cadena:')}</label>
                    <span>{normalizeText(recuento.cadena.nombre)}</span>
                    </div>
                    <div className="info-item">
                    <label>{t('Mercado:')}</label>
                    <span>{recuento.mercado.id} - {normalizeText(recuento.mercado.descripcion)}</span>
                    </div>
                </div>
                </div>

                <div className="recuento-section">
                <h3>Alias</h3>
                <div className="info-grid">
                    <div className="info-item">
                    <label>ID:</label>
                    <span>{recuento.alias.id}</span>
                    </div>
                    <div className="info-item">
                    <label>{t('Nombre:')}</label>
                    <span>{recuento.alias.nombre}</span>
                    </div>
                    <div className="info-item">
                    <label>{t('Tipo:')}</label>
                    <span>{recuento.alias.idTipoAlias}</span>
                    </div>
                </div>
                </div>

                <div className="recuento-section">
                <h3>{t('Stock - Editable')}</h3>
                <div className="info-grid editable">
                    <div className="info-item">
                    <label>{t('Stock Físico:')}</label>
                    <input 
                        type="number"
                        value={stockFisico}
                        onChange={(e) => setStockFisico(e.target.value)}
                        className="editable-input"
                        min="0"
                        pattern="\d*"
                    />
                    </div>
                    <div className="info-item">
                    <label>{t('Stock Validado:')}</label>
                    <span>{recuento.stockFisicoValidado || '-'}</span>
                    </div>
                    <div className="info-item">
                    <label>{t('Capacidad Máxima:')}</label>
                    <input 
                        type="number"
                        value={capacidadMaxima}
                        onChange={(e) => setCapacidadMaxima(e.target.value)}
                        className="editable-input"
                        min="0"
                        pattern="\d*"
                    />
                    </div>
                    <div className="info-item">
                    <label>{t('Capacidad Validada:')}</label>
                    <span>{recuento.capacidadMaximaFisicaValidada || '-'}</span>
                    </div>
                </div>
                </div>

                <div className="recuento-section">
                <h3>{t('Artículo')}</h3>
                <div className="info-grid">
                    <div className="info-item">
                    <label>ID:</label>
                    <span>{recuento.ajeno.id}</span>
                    </div>
                    <div className="info-item">
                    <label>{t('Descripción:')}</label>
                    <span>{normalizeText(recuento.ajeno.nombre)}</span>
                    </div>
                </div>
                </div>

                <div className="recuento-section">
                <h3>{t('Fechas')}</h3>
                <div className="info-grid">
                    <div className="info-item">
                    <label>{t('Creación:')}</label>
                    <span>{recuento.fechaAlta}</span>
                    </div>
                    <div className="info-item">
                    <label>{t('Recogida:')}</label>
                    <span>{recuento.fechaRecogida || '-'}</span>
                    </div>
                    <div className="info-item">
                    <label>{t('Respuesta:')}</label>
                    <span>{recuento.fechaRespuesta || '-'}</span>
                    </div>
                    <div className="info-item">
                    <label>{t('Validación:')}</label>
                    <span>{recuento.fechaValidacion || '-'}</span>
                    </div>
                </div>
                </div>
            </div>
            
            <div className="modal-footer">
                <button 
                className="cancel-button" 
                onClick={onClose}
                disabled={loading}
                >
                {t('Cancelar')}
                </button>
                <button 
                className="accept-button" 
                onClick={handleAceptar}
                disabled={loading}
                >
                {loading ? t('Guardando...') : t('Aceptar')}
                </button>
            </div>
            </div>
        </div>
    );
};

export default ViewRecuento07Modal;