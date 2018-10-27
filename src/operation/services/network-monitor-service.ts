import { inject } from '../../common/container';
import { scheduled } from '../../common/task';
import { getNetworkTraffic, NetworkTrafficSize } from '../../common/util';
import Service from '../../common/service';
import NotificationService from './notification-service';
import ConfigService from './config-service';
import NetworkTrafficRepository from '../repositories/network-traffic-repository';

class NetworkMonitorService extends Service {
  private static measuredTraffic: NetworkTrafficSize = null;
  private static systemTraffic: NetworkTrafficSize = { rx: Number.MAX_SAFE_INTEGER, tx: Number.MAX_SAFE_INTEGER };

  @inject() private configService: ConfigService;
  @inject() private networkTrafficRepository: NetworkTrafficRepository;
  @inject() private notificationService: NotificationService;
  @inject() private serverTraffics: Set<NetworkTrafficSize>;

  async getNetworkInfo() {
    const networkConfig = await this.configService.get('network');
    const traffic = await this.getTodayTraffic();

    return {
      traffic,
      trafficSize: networkConfig.trafficSize || 10737418240
    };
  }

  async getNetworkTrafficStats(fromDate?: string, toDate?: string) {
    // fromDate가 설정되어 있지 않다면 7일 전으로 설정함.
    if (!fromDate) {
      let d = new Date();
      d.setDate(d.getDate() - 7);
      fromDate = d.toISOString().substring(0, 10);
    }

    // toDate가 설정되어 있지 않다면 오늘로 설정함.
    if (!toDate) {
      let d = new Date();
      d.setDate(d.getDate() + 1);
      toDate = d.toISOString().substring(0, 10);
    }

    return await this.networkTrafficRepository.getStatsBetween(fromDate, toDate);
  }

  async getTodayTraffic() {
    const result = await this.getNetworkTrafficStats(new Date().toISOString().substring(0, 10));

    if (result.length === 0) {
      return { rx: 0, tx: 0 };
    } else {
      return result[0];
    }
  }

  // 시간당 트래픽 측정 후 초과시 알림
  @scheduled({ time: '0 * * * *' })
  async checkNetworkTrafficOver() {
    const traffic = await this.getTodayTraffic();
    const networkConfig = await this.configService.get('network');
    const trafficSize = networkConfig.trafficSize || 1073741824;

    if (traffic.tx > trafficSize) {
      await this.notificationService.notify(
        'WARNING',
        'operation.networkTrafficOver',
        '네트워크 트래픽이 주어진 용량을 초과하였습니다. 단기적인 트래픽 초과는 갑작스러운 방문객의 급증으로 인해 발생할 수 있으므로 아무런 제재를 하지 않습니다. 하지만 용량 초과가 장기간 지속될 경우에는 서비스가 정지될 수 있으니 상위사양으로 변경 부탁드립니다.'
      );
    }
  }

  // 시간당 트래픽 측정 및 통계 반영
  @scheduled({ time: '0 * * * *', start: true })
  async measureNetworkTraffic() {
    const systemTraffic = await this.measureSystemNetworkTrafficIncrements();
    let traffic = NetworkMonitorService.measuredTraffic;

    if (!traffic) {
      NetworkMonitorService.measuredTraffic = traffic = { rx: 0, tx: 0 };
      this.serverTraffics.add(traffic);
      return;
    }

    const data =  {
      ...traffic,
      srx: systemTraffic.rx,
      stx: systemTraffic.tx
    };

    await this.networkTrafficRepository.create(data);

    this.log.debug(data, 'network traffic has measured');

    traffic.rx = 0;
    traffic.tx = 0;
  }

  async measureSystemNetworkTrafficIncrements() {
    const traffic = await getNetworkTraffic();
    const prev = NetworkMonitorService.systemTraffic;
    const result = { rx: 0, tx: 0 };

    if (traffic.tx - prev.tx >= 0) {
      result.rx = traffic.rx - prev.rx;
      result.tx = traffic.tx - prev.tx;
    }

    NetworkMonitorService.systemTraffic = traffic;

    return result;
  }
}

export default NetworkMonitorService;
