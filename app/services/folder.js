module.exports = (Model) => {
  const Create = folder => Model.folder.create(folder)

  const Delete = (folder) => { }

  const GetTree = () => {}

  const GetParent = (folder) => { }

  const GetChildren = (folder) => {}

  return {
    Name: 'Folder',
    Create,
    Delete,
    GetTree,
    GetParent,
    GetChildren
  }
}
