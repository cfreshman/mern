import React from 'react';
import styled from 'styled-components';

const Style = styled.div`
    position: relative;
    & .signature {
        position: absolute;
        top: .05rem;
        color: var(--light);
        opacity: .5;
        font-size: 0.5rem;
    }
`

export const Footer = () => (
    <Style id="footer" className="centering">
        <span className="signature">Cyrus Freshman 2020</span>
    </Style>
)
