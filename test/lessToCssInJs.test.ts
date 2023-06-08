import { lessToCssInJs } from '../src/lessToCssInJs';

describe('lessToCssInJs', () => {
  it('lessToCssInJs for content', () => {
    expect(
      lessToCssInJs(`.dynamic-button {
    height: 100%;
    position: absolute !important;
    right: 1px;
    top: 0;
    
    button {
      border: none;
      padding: 0;
      box-shadow: none;
      background-color: transparent !important;
    }
  
    &::after {
      content: "";
      position: absolute;
      width: 1px;
      height: 19px;
      left: 0;
      top: 8px;
      border-left: 1px dotted rgb(0 0 0 / 12%);
    }
  }
  
  .dynamic-menu {
    width: 187px;
  
    em {
      color: #ccc;
      font-size: 11px;
    }
  }`)
    ).toMatchSnapshot();
  });

  it('lessToCssInJs for global', () => {
    expect(
      lessToCssInJs(`@import (reference) '~antd/es/style/themes/index';

      @pro-header-hover-bg: rgba(0, 0, 0, 0.025);
      
      .menu {
        :global(.anticon) {
          margin-right: 8px;
        }
        :global(.ant-dropdown-menu-item) {
          min-width: 160px;
        }
      }
      `)
    ).toMatchSnapshot();
  });
});
