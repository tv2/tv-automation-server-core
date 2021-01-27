COPY ..\packages\server-core-integration\LICENSE .\
COPY ..\packages\server-core-integration\package.json .\

DEL /S /Q dist
COPY ..\packages\server-core-integration\dist .\dist
