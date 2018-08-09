const bcrypt = require('bcryptjs')

module.exports = (Model) => {
  // NOTE: sample implementation
  const GetAll = () => Model.User.find({})

  const Create = async (body) => {
    const rootFolderName = body.email + '_ROOT'
    const rootFolder = await Model.folder.create({
      name: rootFolderName
    })

    const hashedPassword = bcrypt.hashSync(body.password, 8)
    const user = await Model.users.create({
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      password: hashedPassword,
      root_folder_id: rootFolder.id
    })
    return user;
  }

  const GetUserById = (id) => {
    return Model.users.findOne({
      where: { id }
    }).then(response => {
      return response.dataValues;
    });
  }

  const GetUsersRootFolder = (id) => {
    return Model.users.findAll({ include: [Model.folder]
    }).then(user => {
      return user.dataValues;
    })
  }

  return {
    Name: 'User',
    GetAll,
    Create,
    GetUserById,
    GetUsersRootFolder
  }
}
