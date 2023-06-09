﻿import { lessToCssInJs } from '../src/lessToCssInJs';

describe('lessToCssInJs', () => {
  it('lessToCssInJs for content', async () => {
    expect(
      await lessToCssInJs(`.dynamic-button {
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

  it('lessToCssInJs for global', async () => {
    expect(
      await lessToCssInJs(`@import (reference) '~antd/es/style/themes/index';

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

  it('lessToCssInJs for  @media', async () => {
    expect(
      await lessToCssInJs(`@import '~antd/es/style/themes/default.less';

    .textOverflow() {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      word-break: break-all;
    }
    
    // mixins for clearfix
    // ------------------------
    .clearfix() {
      zoom: 1;
      &::before,
      &::after {
        display: table;
        content: ' ';
      }
      &::after {
        clear: both;
        height: 0;
        font-size: 0;
        visibility: hidden;
      }
    }
    
    .activitiesList {
      padding: 0 24px 8px 24px;
      .username {
        color: @text-color;
      }
      .event {
        font-weight: normal;
      }
    }
    
    .pageHeaderContent {
      display: flex;
      .avatar {
        flex: 0 1 72px;
        & > span {
          display: block;
          width: 72px;
          height: 72px;
          border-radius: 72px;
        }
      }
      .content {
        position: relative;
        top: 4px;
        flex: 1 1 auto;
        margin-left: 24px;
        color: @text-color-secondary;
        line-height: 22px;
        .contentTitle {
          margin-bottom: 12px;
          color: @heading-color;
          font-weight: 500;
          font-size: 20px;
          line-height: 28px;
        }
      }
    }
    
    .extraContent {
      .clearfix();
    
      float: right;
      white-space: nowrap;
      .statItem {
        position: relative;
        display: inline-block;
        padding: 0 32px;
        > p:first-child {
          margin-bottom: 4px;
          color: @text-color-secondary;
          font-size: @font-size-base;
          line-height: 22px;
        }
        > p {
          margin: 0;
          color: @heading-color;
          font-size: 30px;
          line-height: 38px;
          > span {
            color: @text-color-secondary;
            font-size: 20px;
          }
        }
        &::after {
          position: absolute;
          top: 8px;
          right: 0;
          width: 1px;
          height: 40px;
          background-color: @border-color-split;
          content: '';
        }
        &:last-child {
          padding-right: 0;
          &::after {
            display: none;
          }
        }
      }
    }
    
    .members {
      a {
        display: block;
        height: 24px;
        margin: 12px 0;
        color: @text-color;
        transition: all 0.3s;
        .textOverflow();
        .member {
          margin-left: 12px;
          font-size: @font-size-base;
          line-height: 24px;
          vertical-align: top;
        }
        &:hover {
          color: @primary-color;
        }
      }
    }
    
    .projectList {
      :global {
        .ant-card-meta-description {
          height: 44px;
          overflow: hidden;
          color: @text-color-secondary;
          line-height: 22px;
        }
      }
      .cardTitle {
        font-size: 0;
        a {
          display: inline-block;
          height: 24px;
          margin-left: 12px;
          color: @heading-color;
          font-size: @font-size-base;
          line-height: 24px;
          vertical-align: top;
          &:hover {
            color: @primary-color;
          }
        }
      }
      .projectGrid {
        width: 33.33%;
      }
      .projectItemContent {
        display: flex;
        height: 20px;
        margin-top: 8px;
        overflow: hidden;
        font-size: 12px;
        line-height: 20px;
        .textOverflow();
        a {
          display: inline-block;
          flex: 1 1 0;
          color: @text-color-secondary;
          .textOverflow();
          &:hover {
            color: @primary-color;
          }
        }
        .datetime {
          flex: 0 0 auto;
          float: right;
          color: @disabled-color;
        }
      }
    }
    
    .datetime {
      color: @disabled-color;
    }
    
    @media screen and (max-width: @screen-xl) and (min-width: @screen-lg) {
      .activeCard {
        margin-bottom: 24px;
      }
      .members {
        margin-bottom: 0;
      }
      .extraContent {
        margin-left: -44px;
        .statItem {
          padding: 0 16px;
        }
      }
    }
    
    @media screen and (max-width: @screen-lg) {
      .activeCard {
        margin-bottom: 24px;
      }
      .members {
        margin-bottom: 0;
      }
      .extraContent {
        float: none;
        margin-right: 0;
        .statItem {
          padding: 0 16px;
          text-align: left;
          &::after {
            display: none;
          }
        }
      }
    }
    
    @media screen and (max-width: @screen-md) {
      .extraContent {
        margin-left: -16px;
      }
      .projectList {
        .projectGrid {
          width: 50%;
        }
      }
    }
    
    @media screen and (max-width: @screen-sm) {
      .pageHeaderContent {
        display: block;
        .content {
          margin-left: 0;
        }
      }
      .extraContent {
        .statItem {
          float: none;
        }
      }
    }
    
    @media screen and (max-width: @screen-xs) {
      .projectList {
        .projectGrid {
          width: 100%;
        }
      }
    }
    `)
    ).toMatchSnapshot();
  });

  it('lessToCssInJs support linear-gradient', async () => {
    expect(
      await lessToCssInJs(`.drag-handle {
      vertical-align: bottom;
      cursor: move;
      display: inline-flex;
      align-items: stretch;
      justify-content: center;
      height: 22px;
     //   width: 22px;
      &::before {
        content: '';
        display: block;
        width: 6px;
        background:
          linear-gradient(90deg, transparent 0, white 1px, white 2px) center,
          linear-gradient(transparent 0, white 1px, white 2px) center;
        background-size: 2px 2px;
      }
    }
    
    .sortable-container {
      transition: background-color 200ms ease-out;
      transition-delay: 300ms; // short pause before returning to original bgcolor
    
      &.sortable-container-dragging {
        transition-delay: 0s;
        background-color: #fff;
      }
    }
    `)
    ).toMatchSnapshot();
  });
});
