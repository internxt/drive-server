module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeConstraint('foldersancestors', 'foldersancestors_ibfk_1');
    await queryInterface.removeConstraint('foldersancestors', 'foldersancestors_ibfk_2');
    await queryInterface.removeColumn('folders', 'hierarchy_level');
    return queryInterface.dropTable('foldersancestors');
  },

  down: async (queryInterface, Sequelize) => {
    const raw = 'CREATE TABLE `foldersancestors` ('
      + '`folder_id` int(11) NOT NULL, '
      + '`ancestor_id` int(11) NOT NULL, '
      + 'PRIMARY KEY (`folder_id`,`ancestor_id`), '
      + 'UNIQUE KEY `foldersancestors_folder_id_ancestor_id_unique` (`folder_id`,`ancestor_id`), '
      + 'KEY `ancestor_id` (`ancestor_id`), '
      + 'CONSTRAINT `foldersancestors_ibfk_1` '
      + 'FOREIGN KEY (`folder_id`) REFERENCES `folders` (`id`) '
      + 'ON DELETE CASCADE ON UPDATE CASCADE, '
      + 'CONSTRAINT `foldersancestors_ibfk_2` FOREIGN KEY (`ancestor_id`) REFERENCES `folders` (`id`) '
      + 'ON DELETE CASCADE ON UPDATE CASCADE ) '
      + 'ENGINE=InnoDB DEFAULT CHARSET=utf8;';
    await queryInterface.addColumn('folders', 'hierarchy_level', {
      type: Sequelize.INTEGER
    });
    return queryInterface.sequelize.query(raw);
  }
};
