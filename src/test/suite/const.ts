export const TSX_TEMPLATE = `
  import React, { useState } from 'react';
  import { Input, Modal, Button } from 'antd';
  import classnames from 'classnames';

  import { ReactComponent as CloseIcon } from '@/assets/common/icons/close-icon.svg';
  import { ReactComponent as SelectIcon } from '@/assets/common/icons/select-icon.svg';

  import { MenuIcons, DEFAULT_ICON_ID } from '../../const';

  import './EditMenuInfoModel.less';

  interface IEditMenuInfoModelProps {
    defaultName: string;
    defaultIconId: number;
    onSave(name: string, iconId: number): void;
    onDelete(): void;
    onCancel(): void;
  }

  const EditMenuInfoModel = (props: IEditMenuInfoModelProps) => {
    const { defaultName, defaultIconId, onDelete, onCancel } = props;
    const [name, setName] = useState(defaultName);
    const [iconId, setIconId] = useState(defaultIconId);

    const handleSelectThanSum = () => {
      showToast({
        type: 'error',
        title: 'Sorry',
        desc: 'There is no space for more dishes.',
      });
    };

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      setName(e.target.value);
    };

    const handleChangeMenuIcon = (index: number) => {
      const newIconId = iconId === index ? DEFAULT_ICON_ID : index;
      setIconId(newIconId);
    };

    const handleSave = () => {
      props.onSave(name, iconId);
    };

    return (
      <Modal
        className="edit-menu-info-modal"
        title={'Edit Page Info'}
        visible
        centered
        width={780}
        closeIcon={<CloseIcon />}
        footer={null}
        destroyOnClose
        onCancel={onCancel}
      >
        <div className="edit-menu-info-modal-content">
          <p className="edit-menu-info-modal-name-desc">Page Name</p>
          <Input
            defaultValue={name}
            allowClear
            maxLength={255}
            placeholder="Please Enter"
            onChange={handleChange}
          />

          <p className="edit-menu-info-modal-icon-desc">Choose Icon</p>
          <div className="edit-menu-info-modal-icon-wrapper">
            <div className="edit-menu-info-modal-icon-box">
              {MenuIcons.map((Icon, index) => {
                const active = index + 1 === iconId;
                return (
                  <div
                    key={index}
                    className={classnames('edit-menu-info-modal-icon-item', {
                      'edit-menu-info-modal-icon-item-active': active,
                    })}
                    onClick={() => handleChangeMenuIcon(index + 1)}
                  >
                    {active && (
                      <div className="edit-menu-info-modal-active-icon">
                        <SelectIcon />
                      </div>
                    )}
                    <div className="edit-menu-info-modal-icon">
                      <Icon />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="edit-menu-info-modal-footer">
          <Button
            className="edit-menu-info-modal-delete"
            type="primary"
            size="large"
            ghost
            onClick={onDelete}
          >
            Delete
          </Button>
          <Button
            className="edit-menu-info-modal-save"
            type="primary"
            size="large"
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </Modal>
    );
  };

  export default EditMenuInfoModel;
`;

export const TSX_TEMPLATE_TRANS = `
  import React, { useState } from 'react';
  import { Input, Modal, Button } from 'antd';
  import classnames from 'classnames';

  import { ReactComponent as CloseIcon } from '@/assets/common/icons/close-icon.svg';
  import { ReactComponent as SelectIcon } from '@/assets/common/icons/select-icon.svg';

  import { MenuIcons, DEFAULT_ICON_ID } from '../../const';

  import './EditMenuInfoModel.less';

  interface IEditMenuInfoModelProps {
    defaultName: string;
    defaultIconId: number;
    onSave(name: string, iconId: number): void;
    onDelete(): void;
    onCancel(): void;
  }

  const EditMenuInfoModel = (props: IEditMenuInfoModelProps) => {
    const { defaultName, defaultIconId, onDelete, onCancel } = props;
    const [name, setName] = useState(defaultName);
    const [iconId, setIconId] = useState(defaultIconId);

    const handleSelectThanSum = () => {
      showToast({
        type: 'error',
        title: trans('menu_ochaMenuList_simpleDialog_text_sorry'),
        desc: trans('menu_ochaMenuList_simpleDialog_text_noSpace'),
      });
    };

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      setName(e.target.value);
    };

    const handleChangeMenuIcon = (index: number) => {
      const newIconId = iconId === index ? DEFAULT_ICON_ID : index;
      setIconId(newIconId);
    };

    const handleSave = () => {
      props.onSave(name, iconId);
    };

    return (
      <Modal
        className="edit-menu-info-modal"
        title={trans('menu_ochaMenuList_dialog_text_editPageInfo')}
        visible
        centered
        width={780}
        closeIcon={<CloseIcon />}
        footer={null}
        destroyOnClose
        onCancel={onCancel}
      >
        <div className="edit-menu-info-modal-content">
          <p className="edit-menu-info-modal-name-desc">{trans('menu_ochaMenuList_dialog_text_pageName')}</p>
          <Input
            defaultValue={name}
            allowClear
            maxLength={255}
            placeholder={trans('menu_ochaMenuList_dialog_hint_pleaseEnter')}
            onChange={handleChange}
          />

          <p className="edit-menu-info-modal-icon-desc">{trans('menu_ochaMenuList_dialog_text_chooseIcon')}</p>
          <div className="edit-menu-info-modal-icon-wrapper">
            <div className="edit-menu-info-modal-icon-box">
              {MenuIcons.map((Icon, index) => {
                const active = index + 1 === iconId;
                return (
                  <div
                    key={index}
                    className={classnames('edit-menu-info-modal-icon-item', {
                      'edit-menu-info-modal-icon-item-active': active,
                    })}
                    onClick={() => handleChangeMenuIcon(index + 1)}
                  >
                    {active && (
                      <div className="edit-menu-info-modal-active-icon">
                        <SelectIcon />
                      </div>
                    )}
                    <div className="edit-menu-info-modal-icon">
                      <Icon />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="edit-menu-info-modal-footer">
          <Button
            className="edit-menu-info-modal-delete"
            type="primary"
            size="large"
            ghost
            onClick={onDelete}
          >
            {trans('general_btn_delete')}
          </Button>
          <Button
            className="edit-menu-info-modal-save"
            type="primary"
            size="large"
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </Modal>
    );
  };

  export default EditMenuInfoModel;
`;
