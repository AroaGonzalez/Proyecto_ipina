import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import '../styles/viewPropuestaSFIModal.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const ViewPropuestaSFIModal = ({ propuesta, onClose, onUpdate }) => {
    const { t } = useTranslation();
    const [cantidad, setCantidad] = useState(propuesta?.cantidad || '');
    const [loading, setLoading] = useState(false);

    if (!propuesta) return null;

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

    return (
        <div className="modal-overlay">
            <div className="modal-content propuesta-sfi">
                <div className="modal-header">
                    <h2>{t('Simulación SFI - Propuesta')} #{propuesta.idPropuesta}</h2>
                    <button className="close-button" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                
                <div className="modal-body">
                    <div className="propuesta-section">
                        <h3>{t('Información General')}</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>{t('ID Evento:')}</label>
                                <span>{propuesta.idEvento}</span>
                            </div>
                            <div className="info-item">
                                <label>{t('Evento:')}</label>
                                <span>{normalizeText(propuesta.nombreEvento)}</span>
                            </div>
                            <div className="info-item">
                                <label>{t('Estado:')}</label>
                                <span className="estado-propuesta estado-2">{propuesta.tipoEstadoPropuesta.descripcion}</span>
                            </div>
                            <div className="info-item">
                                <label>{t('Código Ejecución:')}</label>
                                <span>{propuesta.codEjecucion}</span>
                            </div>
                        </div>
                    </div>

                    <div className="propuesta-section">
                        <h3>{t('Localización')}</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>ID:</label>
                                <span>{propuesta.localizacionCompra.id}</span>
                            </div>
                            <div className="info-item">
                                <label>{t('Descripción:')}</label>
                                <span>{normalizeText(propuesta.localizacionCompra.descripcion)}</span>
                            </div>
                            <div className="info-item">
                                <label>{t('Cadena:')}</label>
                                <span>{normalizeText(propuesta.cadena.descripcion)}</span>
                            </div>
                            <div className="info-item">
                                <label>{t('Mercado:')}</label>
                                <span>{propuesta.mercado.id} - {normalizeText(propuesta.mercado.descripcion)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="propuesta-section">
                        <h3>{t('Unidad de Compras')}</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>{t('ID:')}</label>
                                <span>{propuesta.unidadComprasGestora?.id || '-'}</span>
                            </div>
                            <div className="info-item">
                                <label>{t('Nombre:')}</label>
                                <span>{normalizeText(propuesta.unidadComprasGestora?.descripcion || '-')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="propuesta-section">
                        <h3>{t('Artículo')}</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>{t('ID:')}</label>
                                <span>{propuesta.idAjeno}</span>
                            </div>
                            <div className="info-item">
                                <label>{t('Descripción:')}</label>
                                <span>{normalizeText(propuesta.descripcionAjeno)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="propuesta-section">
                        <h3>{t('Alias')}</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>{t('ID:')}</label>
                                <span>{propuesta.idAlias}</span>
                            </div>
                            <div className="info-item">
                                <label>{t('Descripción:')}</label>
                                <span>{normalizeText(propuesta.descripcionAlias)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="propuesta-section">
                        <h3>{t('Cantidad - Editable')}</h3>
                        <div className="info-grid editable">
                            <div className="info-item">
                                <label>{t('Cantidad:')}</label>
                                <input 
                                    type="number"
                                    value={cantidad}
                                    onChange={(e) => setCantidad(e.target.value)}
                                    className="editable-input"
                                    min="0"
                                    pattern="\d*"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="propuesta-section">
                        <h3>{t('Fechas')}</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>{t('Creación:')}</label>
                                <span>{propuesta.fechaCreacion || '-'}</span>
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
                </div>
            </div>
        </div>
    );
};

export default ViewPropuestaSFIModal;