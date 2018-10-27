import { inject } from '../../common/container';
import Service from '../../common/service';
import { ForbiddenError } from '../../common/errors';
import Authentication from '../../user/authentication';

import AclRepository from '../repositories/acl-repository';
import AclEntry from '../models/acl-entry';
import AclPermission from '../models/acl-permission';

interface CachedAcl {
  typeName: string;
  objectId: number;
  mask: AclPermission;
  entries: AclEntry[];
  grantedUsers: number[];
  grantedAuthorities: number[];
  ungrantedUsers: number[];
  ungrantedAuthorities: number[];
}

class Acl extends Service {
  @inject() auth: Authentication;
  @inject() aclRepository: AclRepository;

  aclMap = new Map<string, CachedAcl>();

  clearCache() {
    this.aclMap.clear();
  }

  getAclHash(mask: AclPermission, typeName: string, objectId: number): string {
    if (objectId === null) {
      return `acl-${typeName}-${mask.toString()}`;
    }

    return `acl-${typeName}-${objectId.toString()}-${mask.toString()}`;
  }

  getCachedAcl(mask: AclPermission, typeName: string, objectId: number): CachedAcl {
    let hash = this.getAclHash(mask, typeName, objectId);
    let acl = this.aclMap.get(hash);

    return acl;
  }

  setCachedAcl(mask: AclPermission, typeName: string, objectId: number, entries: AclEntry[]) {
    let hash = this.getAclHash(mask, typeName, objectId);
    let acl = {
      typeName,
      objectId,
      mask,
      entries,
      grantedUsers: entries.filter(k => k.principal && k.granting).map(k => k.sid),
      grantedAuthorities: entries.filter(k => !k.principal && k.granting).map(k => k.sid),
      ungrantedUsers: entries.filter(k => k.principal && !k.granting).map(k => k.sid),
      ungrantedAuthorities: entries.filter(k => !k.principal && !k.granting).map(k => k.sid)
    };

    this.aclMap.set(hash, acl);
  }

  async getAcl(mask: AclPermission, typeName: string, objectId: number) {
    let acl = this.getCachedAcl(mask, typeName, objectId);

    if (!acl) {
      let entries = await this.aclRepository.getAclEntries(mask, typeName, objectId);
      this.setCachedAcl(mask, typeName, objectId, entries);
      acl = this.getCachedAcl(mask, typeName, objectId);
    }

    return acl;
  }

  /**
   * 접속한 회원에 대해 ACL 권한을 확인한다.
   * @param acl 캐시된 ACL 개체
   */
  checkAcl(acl: CachedAcl) {
    let user = this.auth.user;

    // ACL이 설정되어 있지 않다면 로그인 여부와 상관없이 부정적 권한을 가졌다고 해석함.
    if (acl.entries.length === 0) {
      return false;
    }

    // 반대로 ACL이 하나라도 설정되어 있다면 반드시 로그인되어 있어야 함.
    if (!user) {
      throw new ForbiddenError();
    }

    // 긍정적 권한을 최우선으로 판단한다.
    if (
      acl.grantedUsers.indexOf(user.id) >= 0 ||
      user.authorities.some(k => acl.grantedAuthorities.indexOf(k.id) >= 0)
    ) {
      return true;
    }

    // 부정적 권한은 긍정적 권한의 배경으로서 작용함. 
    // 예: USER 권한은 모든 회원이 가지므로 USER 권한을 부정적으로,
    // MANAGER 권한은 긍정적으로 설정하면 오직 MANAGER 권한을 가진 회원만 접근 가능하다는 뜻.
    if (
      acl.ungrantedUsers.indexOf(user.id) >= 0 ||
      user.authorities.some(k => acl.ungrantedAuthorities.indexOf(k.id) >= 0)
    ) {
      throw new ForbiddenError();
    }

    return false;
  }

  /**
   * negative가 true라면 아무 권한도 명시되지 않은 경우 예외를 일으킨다. 즉 무조건 긍정적 권한만 통과됨.
   * negative가 false라면 이 메소드의 반환값으로 긍정적 권한인지(true) 부정적 권한인지(false) 알 수 있다.
   * @param mask 
   * @param typeName 
   * @param objectId null 값인 경우 타입 자체에 대해서만 검사를 한다.
   * @param negative 아무 권한도 명시되지 않은 경우 권한을 부정적으로 판단할 것인지 여부.
   */
  async hasPermission(mask: AclPermission, typeName: string, objectId: number, negative = false): Promise<boolean> {
    let user = this.auth.user;
    let acl = await this.getAcl(mask, typeName, objectId);

    // ForbiddenError가 예외가 발생하는 것 외에 긍정/부정 권한판단은 아래 표와 같다.
    // 개체 | 타입 = 판단
    //   O | -    = 긍정 (타입에 대해서는 검사하지 않음.)
    //   X | O    = 긍정
    //   X | X    = 부정 (negative가 설정되면 ForbiddenError 예외 발생)
    if (!this.checkAcl(acl)) {
      if (objectId !== null) {
        // objectId가 null이라면 타입 자체에 대한 ACL을 검사한다는 의미임.
        let typeAcl = await this.getAcl(mask, typeName, null);

        // 타입 자체에 대해 긍정적 권한이라면 긍정적 권한을 가진 것으로 해석함.
        if (this.checkAcl(typeAcl) === true) {
          return true;
        }
      }

      if (negative) {
        throw new ForbiddenError();
      }

      return false;
    }

    return true;
  }
}

export default Acl;
