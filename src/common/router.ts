
enum RouterPartType {
  Param,
  NumParam,
  Static
}

interface RoutePatternPart {
  type: RouterPartType;
  value: string;
}

interface RouteParamDictionary {
  [key: string]: any;
}

interface RouterItem {
  method: string;
  routePattern: RoutePattern;
}

class RoutePattern {
  public pattern: string;
  public value: any;
  public parts: RoutePatternPart[];
  public paramNames: string[];

  constructor(pattern: string, value: any) {
    this.pattern = pattern;
    this.value = value;
    this.parts = this.getParts(pattern);
    this.paramNames = this.parts.filter(part => part.type !== RouterPartType.Static).map(part => part.value);
  }

  getParts(pattern: string) {
    if (pattern[0] !== '/') {
      throw new Error('Pattern must start with "/".');
    }

    let splits = pattern.substring(1).split('/');

    return splits.map(word => {
      switch (word[0]) {
        case ':':
          return { type: RouterPartType.Param, value: word.substring(1) };
        case '#':
          return { type: RouterPartType.NumParam, value: word.substring(1) };
        default:
          return { type: RouterPartType.Static, value: word };
      }
    });
  }

  getParams(url: string): RouteParamDictionary {
    if (this.paramNames.length === 0) {
      if (url === this.pattern) {
        return {};
      } else {
        return null;
      }
    }

    let urlParts = url.substring(1).split('/');

    if (urlParts.length !== this.parts.length) {
      return null;
    }

    let params = {};

    for (let i = 0; i < this.parts.length; i++) {
      switch (this.parts[i].type) {
        case RouterPartType.Param:
        {
          let param = decodeURI(urlParts[i]);
          let cvt = Number(param);

          params[this.parts[i].value] = Number.isNaN(cvt) ? param : cvt;
          break;
        }
        case RouterPartType.NumParam:
        {
          let param = decodeURI(urlParts[i]);
          let cvt = Number(param);

          if (Number.isNaN(cvt)) {
            return null;
          }

          params[this.parts[i].value] = cvt;
          break;
        }
        default:
        {
          if (this.parts[i].value !== urlParts[i]) {
            return null;
          }
        }
      }
    }

    return params;
  }
}

class Router {
  public patterns: RouterItem[] = [];

  add(method: string, pattern: string, value: any) {
    let r = new RoutePattern(pattern, value);

    this.patterns.push({
      method,
      routePattern: r
    });
  }

  find(method: string, url: string) {
    for (let p of this.patterns) {
      if (p.method !== method) {
        continue;
      }

      let r = p.routePattern;
      let params = r.getParams(url);

      if (params !== null) {
        return {
          value: r.value,
          params
        };
      }
    }

    return null;
  }
}

export default Router;
