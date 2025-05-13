const { sequelizeAjenos } = require('../utils/database');

exports.findIdAlias = async (idAlias) => {
  try {
    const query = `
      SELECT ID_ALIAS, ID_TIPO_ALIAS, ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS
      FROM AJENOS.ALIAS
      WHERE ID_ALIAS = :idAlias AND FECHA_BAJA IS NULL
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idAlias },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    if (result && result.length > 0) {
      return {
        idAlias: result[0].ID_ALIAS,
        idTipoAlias: result[0].ID_TIPO_ALIAS,
        idTipoConexionOrigenDatoAlias: result[0].ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS
      };
    }
    
    throw new Error(`Alias con ID ${idAlias} no encontrado.`);
  } catch (error) {
    console.error(`Error en findIdAlias: ${error.message}`);
    throw error;
  }
};

exports.deleteAlias = async (idAlias, usuarioBaja, fechaBaja) => {
  try {
    const query = `
      UPDATE AJENOS.ALIAS 
      SET USUARIO_BAJA = :usuarioBaja, 
          FECHA_BAJA = :fechaBaja,
          ID_TIPO_ESTADO_ALIAS = 0
      WHERE ID_ALIAS = :idAlias
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { idAlias, usuarioBaja, fechaBaja },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    console.log(`Alias ${idAlias} marcado como eliminado`);
  } catch (error) {
    console.error(`Error en deleteAlias: ${error.message}`);
    throw error;
  }
};

exports.deleteAliasAcople = async (idAliasAcople, usuarioBaja, fechaBaja) => {
  try {
    const findPrincipalsQuery = `
      SELECT ID_ALIAS
      FROM AJENOS.ALIAS_ACOPLE
      WHERE ID_ALIAS_ACOPLE = :idAliasAcople
      AND FECHA_BAJA IS NULL
    `;
    
    const principalAliases = await sequelizeAjenos.query(findPrincipalsQuery, {
      replacements: { idAliasAcople },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const deleteAcopleQuery = `
      UPDATE AJENOS.ALIAS_ACOPLE
      SET USUARIO_BAJA = :usuarioBaja, 
          FECHA_BAJA = :fechaBaja
      WHERE ID_ALIAS_ACOPLE = :idAliasAcople
      AND FECHA_BAJA IS NULL
    `;
    
    await sequelizeAjenos.query(deleteAcopleQuery, {
      replacements: { idAliasAcople, usuarioBaja, fechaBaja },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    if (principalAliases && principalAliases.length > 0) {
      const principalIds = principalAliases.map(a => a.ID_ALIAS);
      
      const updatePrincipalsQuery = `
        UPDATE AJENOS.ALIAS
        SET USUARIO_MODIFICACION = :usuarioModificacion, 
            FECHA_MODIFICACION = :fechaModificacion,
            ENTRENADO = 0
        WHERE ID_ALIAS IN (:principalIds)
      `;
      
      await sequelizeAjenos.query(updatePrincipalsQuery, {
        replacements: { 
          principalIds, 
          usuarioModificacion: usuarioBaja, 
          fechaModificacion: fechaBaja 
        },
        type: sequelizeAjenos.QueryTypes.UPDATE
      });
    }
    
    console.log(`Alias acople ${idAliasAcople} eliminado`);
  } catch (error) {
    console.error(`Error en deleteAliasAcople: ${error.message}`);
    throw error;
  }
};

exports.deleteAliasAcopleTarea = async (idAliasAcople, usuarioBaja, fechaBaja) => {
  try {
    const query = `
      UPDATE AJENOS.ALIAS_ACOPLE_TAREA
      SET USUARIO_BAJA = :usuarioBaja, 
          FECHA_BAJA = :fechaBaja
      WHERE ID_ALIAS_ACOPLE = :idAliasAcople
      AND FECHA_BAJA IS NULL
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { idAliasAcople, usuarioBaja, fechaBaja },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    console.log(`Tareas de acople para alias ${idAliasAcople} eliminadas`);
  } catch (error) {
    console.error(`Error en deleteAliasAcopleTarea: ${error.message}`);
    throw error;
  }
};

exports.deleteAliasAcopleTareaIdPrincipal = async (idAlias, usuarioBaja, fechaBaja) => {
  try {
    const query = `
      UPDATE AJENOS.ALIAS_ACOPLE_TAREA
      SET USUARIO_BAJA = :usuarioBaja, 
          FECHA_BAJA = :fechaBaja
      WHERE ID_ALIAS = :idAlias
      AND FECHA_BAJA IS NULL
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { idAlias, usuarioBaja, fechaBaja },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    console.log(`Tareas de acople para alias principal ${idAlias} eliminadas`);
  } catch (error) {
    console.error(`Error en deleteAliasAcopleTareaIdPrincipal: ${error.message}`);
    throw error;
  }
};

exports.deleteAliasIdioma = async (idAlias, usuarioBaja, fechaBaja) => {
  try {
    const query = `
      DELETE FROM AJENOS.ALIAS_IDIOMA
      WHERE ID_ALIAS = :idAlias
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { idAlias },
      type: sequelizeAjenos.QueryTypes.DELETE
    });
    
    console.log(`Idiomas para alias ${idAlias} eliminados`);
  } catch (error) {
    console.error(`Error en deleteAliasIdioma: ${error.message}`);
    throw error;
  }
};

exports.deleteAliasAjenoByIdAlias = async (idAlias, usuarioBaja, fechaBaja) => {
  try {
    const query = `
      UPDATE AJENOS.ALIAS_AJENO
      SET USUARIO_BAJA = :usuarioBaja, 
          FECHA_BAJA = :fechaBaja
      WHERE ID_ALIAS = :idAlias
      AND FECHA_BAJA IS NULL
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { idAlias, usuarioBaja, fechaBaja },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    console.log(`Relaciones con ajenos para alias ${idAlias} eliminadas`);
  } catch (error) {
    console.error(`Error en deleteAliasAjenoByIdAlias: ${error.message}`);
    throw error;
  }
};

exports.deleteStockLocalizacion = async (idAlias, usuarioBaja, fechaBaja) => {
  try {
    const query = `
      UPDATE AJENOS.STOCK_LOCALIZACION_RAM
      SET USUARIO_BAJA = :usuarioBaja, 
          FECHA_BAJA = :fechaBaja
      WHERE ID_ALIAS = :idAlias
      AND FECHA_BAJA IS NULL
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { idAlias, usuarioBaja, fechaBaja },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    console.log(`Stock localización para alias ${idAlias} eliminado`);
  } catch (error) {
    console.error(`Error en deleteStockLocalizacion: ${error.message}`);
    throw error;
  }
};


exports.deleteAliasTarea = async (idAlias, usuarioBaja, fechaBaja) => {
    try {
      const deleteQuery = `
        UPDATE AJENOS.ALIAS_TAREA 
        SET USUARIO_BAJA = :usuarioBaja, 
            FECHA_BAJA = :fechaBaja
        WHERE ID_ALIAS = :idAlias
        AND FECHA_BAJA IS NULL
      `;
      
      await sequelizeAjenos.query(deleteQuery, {
        replacements: { idAlias, usuarioBaja, fechaBaja },
        type: sequelizeAjenos.QueryTypes.UPDATE
      });
      
      const findTareasQuery = `
        SELECT tr.ID_TAREA_RAM
        FROM AJENOS.TAREA_RAM tr
        INNER JOIN AJENOS.ALIAS_TAREA at ON at.ID_TAREA_RAM = tr.ID_TAREA_RAM
        WHERE at.ID_ALIAS = :idAlias
      `;
      
      const tareas = await sequelizeAjenos.query(findTareasQuery, {
        replacements: { idAlias },
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      const tareaIds = tareas.map(t => t.ID_TAREA_RAM);
      
      for (const idTarea of tareaIds) {
        const findAliasesQuery = `
          SELECT a.ID_ALIAS, a.ID_TIPO_ESTADO_ALIAS
          FROM AJENOS.ALIAS a
          INNER JOIN AJENOS.ALIAS_TAREA at ON at.ID_ALIAS = a.ID_ALIAS
          WHERE at.ID_TAREA_RAM = :idTarea
        `;
        
        const aliasesResult = await sequelizeAjenos.query(findAliasesQuery, {
          replacements: { idTarea },
          type: sequelizeAjenos.QueryTypes.SELECT
        });
        
        const todosEliminados = aliasesResult.every(alias => 
          alias.ID_TIPO_ESTADO_ALIAS === 0 || 
          parseInt(alias.ID_ALIAS) === parseInt(idAlias)
        );
        
        if (todosEliminados) {
          await exports.updateTarea(idTarea, usuarioBaja, fechaBaja);
        }
      }
      
      console.log(`Tareas para alias ${idAlias} eliminadas. IDs: ${tareaIds.join(', ')}`);
      return tareaIds;
      
    } catch (error) {
      console.error(`Error en deleteAliasTarea: ${error.message}`);
      throw error;
    }
};
  
exports.updateTarea = async (idTarea, usuarioBaja, fechaBaja) => {
    try {
      const query = `
        UPDATE AJENOS.TAREA_RAM 
        SET USUARIO_MODIFICACION = :usuarioBaja, 
          FECHA_MODIFICACION = :fechaBaja,
          ID_TIPO_ESTADO_TAREA_RAM = 2
        WHERE ID_TAREA_RAM = :idTarea
      `;
      
      await sequelizeAjenos.query(query, {
        replacements: { idTarea, usuarioBaja, fechaBaja },
        type: sequelizeAjenos.QueryTypes.UPDATE
      });
      
      console.log(`Tarea ${idTarea} marcada como eliminada`);
    } catch (error) {
      console.error(`Error en updateTarea: ${error.message}`);
      throw error;
    }
};
  

exports.deleteAliasAmbito = async (idAlias, usuarioBaja, fechaBaja) => {
    try {
      const findAmbitoQuery = `
        SELECT ID_ALIAS_AMBITO
        FROM AJENOS.ALIAS_AMBITO
        WHERE ID_ALIAS = :idAlias
        AND FECHA_BAJA IS NULL
      `;
      
      const ambitoResult = await sequelizeAjenos.query(findAmbitoQuery, {
        replacements: { idAlias },
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      let idAliasAmbito = null;
      if (ambitoResult && ambitoResult.length > 0) {
        idAliasAmbito = ambitoResult[0].ID_ALIAS_AMBITO;
        
        const deleteQuery = `
          UPDATE AJENOS.ALIAS_AMBITO
          SET USUARIO_BAJA = :usuarioBaja, 
            FECHA_BAJA = :fechaBaja
          WHERE ID_ALIAS = :idAlias
          AND FECHA_BAJA IS NULL
        `;
        
        await sequelizeAjenos.query(deleteQuery, {
          replacements: { idAlias, usuarioBaja, fechaBaja },
          type: sequelizeAjenos.QueryTypes.UPDATE
        });
        
      }
      
      return idAliasAmbito;
    } catch (error) {
      console.error(`Error en deleteAliasAmbito: ${error.message}`);
      throw error;
    }
};

exports.deleteAliasAmbitoAplanado = async (idAliasAmbito, usuarioBaja, fechaBaja) => {
    try {
      if (!idAliasAmbito) {
        console.log('No hay ámbito aplanado para eliminar');
        return;
      }
      
      const query = `
        UPDATE AJENOS.ALIAS_AMBITO_APLANADO
        SET USUARIO_BAJA = :usuarioBaja, 
          FECHA_BAJA = :fechaBaja
        WHERE ID_ALIAS_AMBITO = :idAliasAmbito
        AND FECHA_BAJA IS NULL
      `;
      
      await sequelizeAjenos.query(query, {
        replacements: { idAliasAmbito, usuarioBaja, fechaBaja },
        type: sequelizeAjenos.QueryTypes.UPDATE
      });
      
      console.log(`Ámbito aplanado con ID ámbito ${idAliasAmbito} eliminado`);
    } catch (error) {
      console.error(`Error en deleteAliasAmbitoAplanado: ${error.message}`);
      throw error;
    }
};
  
exports.findBaseTarea = async (idTarea) => {
    try {
      const query = `
        SELECT ID_TAREA_RAM as idTarea, 
          ID_TIPO_TAREA as idTipoTarea,
          ID_TIPO_ESTADO_TAREA_RAM as idTipoEstadoTarea
        FROM AJENOS.TAREA_RAM
        WHERE ID_TAREA_RAM = :idTarea
      `;
      
      const result = await sequelizeAjenos.query(query, {
        replacements: { idTarea },
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      if (result && result.length > 0) {
        return {
          idTarea: result[0].idTarea,
          idTipoTarea: result[0].idTipoTarea,
          idTipoEstadoTarea: result[0].idTipoEstadoTarea
        };
      }
      
      throw new Error(`Tarea con ID ${idTarea} no encontrada`);
    } catch (error) {
      console.error(`Error en findBaseTarea: ${error.message}`);
      throw error;
    }
};

exports.deleteTareaAmbitoAplanadoAcople = async (idTarea, idAlias) => {
    try {
      const query = `
        SELECT taa.ID_TAREA_AMBITO_APLANADO
        FROM AJENOS.TAREA_AMBITO_APLANADO taa
        INNER JOIN AJENOS.TAREA_AMBITO ta ON taa.ID_TAREA_AMBITO = ta.ID_TAREA_AMBITO
        WHERE ta.ID_TAREA_RAM = :idTarea
        AND taa.ID_ALIAS_ACOPLE = :idAlias
      `;
      
      const result = await sequelizeAjenos.query(query, {
        replacements: { idTarea, idAlias },
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      return result.map(r => r.ID_TAREA_AMBITO_APLANADO);
    } catch (error) {
      console.error(`Error en deleteTareaAmbitoAplanadoAcople: ${error.message}`);
      throw error;
    }
};

exports.deleteTareaAmbitoAplanadoPrincipal = async (idTarea, idAlias) => {
    try {
      const query = `
        SELECT taa.ID_TAREA_AMBITO_APLANADO
        FROM AJENOS.TAREA_AMBITO_APLANADO taa
        INNER JOIN AJENOS.TAREA_AMBITO ta ON taa.ID_TAREA_AMBITO = ta.ID_TAREA_AMBITO
        WHERE ta.ID_TAREA_RAM = :idTarea
        AND taa.ID_ALIAS = :idAlias
      `;
      
      const result = await sequelizeAjenos.query(query, {
        replacements: { idTarea, idAlias },
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      return result.map(r => r.ID_TAREA_AMBITO_APLANADO);
    } catch (error) {
      console.error(`Error en deleteTareaAmbitoAplanadoPrincipal: ${error.message}`);
      throw error;
    }
};

exports.deleteTareaAmbitoAplanado = async (idsTareaAmbitoAplanado, usuarioBaja, fechaBaja) => {
    try {
      if (!idsTareaAmbitoAplanado || idsTareaAmbitoAplanado.length === 0) {
        console.log('No hay ámbitos aplanados de tarea para eliminar');
        return;
      }
      
      const query = `
        UPDATE AJENOS.TAREA_AMBITO_APLANADO
        SET USUARIO_BAJA = :usuarioBaja, 
          FECHA_BAJA = :fechaBaja
        WHERE ID_TAREA_AMBITO_APLANADO IN (:idsTareaAmbitoAplanado)
      `;
      
      await sequelizeAjenos.query(query, {
        replacements: { idsTareaAmbitoAplanado, usuarioBaja, fechaBaja },
        type: sequelizeAjenos.QueryTypes.UPDATE
      });
      
      console.log(`Ámbitos aplanados de tarea (IDs: ${idsTareaAmbitoAplanado.join(', ')}) eliminados`);
    } catch (error) {
      console.error(`Error en deleteTareaAmbitoAplanado: ${error.message}`);
      throw error;
    }
};