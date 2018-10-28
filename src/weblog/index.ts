import Package from '../common/package';

class WeblogPackage extends Package {
  dependencies = ['user', 'operation'];
}

export default WeblogPackage;
